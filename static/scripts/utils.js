function generateAvatar(firstName, lastname) {
    return `https://avatar.iran.liara.run/username?username=${firstName}+${lastname}`
}

function formatTimestamp(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    date.setTime(date.getTime());
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  function newEl(name, attrs, ...childs) {
    /* create new element */
    const el = document.createElement(name);
    /* add attrebutes to the element */
    if (attrs != undefined) {
      for (let attr of Object.keys(attrs)) {
        el.setAttribute(attr, attrs[attr]);
      }
    }
    /* append childs to the element */
    if (childs != undefined) {
      for (let child of childs) {
        el.appendChild(child);
      }
    }
    return el;
  }


export { generateAvatar, formatTimestamp, newEl };