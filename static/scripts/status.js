import { User } from "/static/scripts/user.js";

class status {
    constructor(){
        this.users = new Map();
        this.getUsers();
        this.initListeners();
    }
    async getUsers(){
        try {
            const resp = await fetch("/api/users");
            if (!resp.ok) throw new Error("Error fetching users");
            const data = await resp.json();

            let usersList = document.querySelector(".user-list");
            usersList.innerHTML = "";
            if (!data) {
                usersList.innerHTML = '<li style="font-size: 16px;color:grey;padding-inline:10px">No users found</li>';
                return;
            }
            
            data.forEach((user) => {
                let userListItem = document.createElement("li");
                userListItem.classList.add("user-item");
                if (user.notify) userListItem.classList.add("has-unread");
                userListItem.dataset.username = user.username;
                userListItem.innerHTML = `
                    <div class="avatar">
                    <img src="${user.avatar}" alt="${user.username}" class="user-avatar" />
                    <div class="unread-dot"></div>
                    </div>
                    <span>${user.firstname} ${user.lastname}</span>
                    <div class="online-indicator ${user.online ? "" : "hidden"}"></div>
                `;
                usersList.appendChild(userListItem);
                let usr = new User({...user,
                    statusListElement: userListItem})
                this.users.set(user.username, usr);                
            } );
        } catch (err) {
            console.error(err);
        } 
    }

    updateStatus(){
        this.statusListElement.classList.toggle("hidden");
    }

    initListeners(){
        document.addEventListener("status", (e) => {
            let user = this.users.get(e.detail.username);
            if (!user) {
                this.getUsers();
            };
            user.online = e.detail.online;
            let statusListElement = user.statusListElement.querySelector(".online-indicator");
            statusListElement.classList.toggle("hidden", !e.detail.online);
        });
    }
}

export { status };