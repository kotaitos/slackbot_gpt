import { Configuration, OpenAIApi } from "openai";
import { google } from 'googleapis';
import { get_user_identifier } from "./utils";

const MAX_TOKEN_SIZE = 4096
const COMPLETION_MAX_TOKEN_SIZE = 1024
const INPUT_MAX_TOKEN_SIZE = MAX_TOKEN_SIZE - COMPLETION_MAX_TOKEN_SIZE

const customSearch = google.customsearch("v1");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
const openai = new OpenAIApi(configuration);

export async function answer_with_websearch(client: any, message: any, say: any, asking_user: any, question: any) {
    say(`<@${asking_user}>さんの質問にWeb検索の結果を踏まえて対応中`)

    const usingTeaam = message['team']
    const userIdentifier = get_user_identifier(usingTeaam, asking_user)

    const queryAskPrompt = `『${question}』という質問をGoogle Scholarの検索で調べるときに適切なクエリを一つ教えてください。検索クエリとは単一の検索のための単語、または、複数の検索のための単語を半角スペースで繋げた文字列です。`
    const queryGptResponse = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{"role": "user", "content": queryAskPrompt}],
        top_p: 1,
        n: 1,
        max_tokens: COMPLETION_MAX_TOKEN_SIZE,
        temperature: 1,
        presence_penalty: 0,
        frequency_penalty: 0,
        logit_bias: {},
        user: userIdentifier
    })

    const queryGptResponseContent = queryGptResponse.data.choices[0].message.content

    let query = ""
    if (queryGptResponseContent) {
        query = queryGptResponseContent
    } else {
        query = question
    }

    console.log(query)
    
    const searchResults = await customSearch.cse.list({
        auth: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: query
    })

    let linkReferences = []
    let linkReferencesResult = ''
    let webResults = []
    if (Number(searchResults.data.searchInformation.totalResults) > 0) {
        for (const [index, result] of Object.entries(searchResults.data.items)) {
            const url = new URL(result.link)
            const domainName = url.hostname
            webResults.push(`[${index+1}]"${result.title}"\nURL:${result.link}`)
            linkReferences.push(`[${index+1}]"${result.title}" <${result.link}|${domainName}>\n`)
        }
        linkReferencesResult = '\n\n' + linkReferences.join('')
    } else {
        return '十分な検索結果が得られませんでした。'
    }

    console.log(webResults)

    const now = new Date().toLocaleDateString()

    const prompt = `
    「${question}」という質問に対して検索結果を参考にしつつ包括的な返答をしてください。
    検索結果の引用をする場合には、[number]表記を必ず用いてください。
    また、検索結果が同名の複数のテーマに言及している場合は、それぞれのテーマについて別々の回答をしてください。\n\n----------------\n\n
    
    検索クエリ: ${query}
    
    検索結果:
    
    ${webResults}
    
    現在日時: ${now}
    `

    const chatGPTResponse = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{"role": "user", "content": prompt}],
        top_p: 1,
        n: 1,
        max_tokens: COMPLETION_MAX_TOKEN_SIZE,
        temperature: 1,
        presence_penalty: 0,
        frequency_penalty: 0,
        logit_bias: {},
        user: userIdentifier
    })

    const content = chatGPTResponse.data.choices[0].message.content + linkReferencesResult
    return content
}