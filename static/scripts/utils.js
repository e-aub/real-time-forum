function generateAvatar(firstName, lastname) {
    return `https://avatar.iran.liara.run/username?username=${firstName}+${lastname}`
}

function formatTimestamp(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    date.setTime(date.getTime() + 3600000);
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }


export { generateAvatar, formatTimestamp };