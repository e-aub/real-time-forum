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

            data.forEach((user) => {
                let userListItem = document.createElement("li");
                userListItem.classList.add("user-item");
                userListItem.dataset.username = user.username;
                userListItem.innerHTML = `
                    <img src="${user.avatar}" alt="${user.username}" class="user-avatar" />
                    <span>${user.firstname} ${user.lastname}</span>
                    <div class="online-indicator ${user.online ? "" : "hidden"}"></div>
                `;
                usersList.appendChild(userListItem);
                let usr = new User({...user,
                    statusListElement: userListItem})
                // console.log("userrrr :",usr)
                this.users.set(user.username, usr);                
            } );
            // console.log(this.users);
        } catch (err) {
            console.error(err);
        } 
    }

    updateStatus(){
        this.statusListElement.classList.toggle("hidden");
    }

    initListeners(){
        document.addEventListener("status", (e) => {
            // console.log(e.detail);
            let user = this.users.get(e.detail.username);
            if (!user) return;
            user.online = e.detail.online;
            // console.log(user,user.statusListElement)
            let statusListElement = user.statusListElement.querySelector(".online-indicator");
            statusListElement.classList.toggle("hidden", !e.detail.online);
        });
    }
}

export { status };