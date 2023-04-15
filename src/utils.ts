export function get_user_identifier(team: string, user: string) {
    return `slack-${team}-${user}`
}