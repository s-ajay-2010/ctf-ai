const API = "http://127.0.0.1:8000";

async function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch (`${API}/login`,{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password})
    });

    const data = await res.json();

    if(res.ok){
        localStorage.setItem("token", data.access_token);
        if(data.is_admin){
            window.location.href = "admin.html";
        }
        else{
            window.location.href = "dashboard.html";
        }
    }
    else{
        document.getElementById("msg").innerText = data.detail;
    }
}

//---------------------------------------------------------------------------------------------------------------------------

async function submitFlag(id) {
    const token = localStorage.getItem("token");
    const flag = document.getElementById(`flag-${id}`).value;

    const res = await fetch(`${API}/submit`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            challenge_id: id,
            flag: flag
        })
    });

    const data = await res.json();
    document.getElementById(`result-${id}`).innerText = data.message;
    loadChallenges();
}


//----------------------------------------------------------------------------------------------------------------------------

async function getHints(id){
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/hints/${id}`,{
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();
    const container = document.getElementById(`hints-${id}`);
    container.innerHTML = data.hints.map(h => `<p>Hint: ${h}</p>`).join("");
    
    document.querySelector(`button[onclick="getHints(${id})"]`).style.display = "none";
}

//----------------------------------------------------------------------------------------------------------------------------


async function loadScoreboard(){
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/scoreboard`, {
        headers:{"Authorization": `Bearer ${token}`}
    });

    const data = await res.json();
    const container = document.getElementById("scoreboard");
    container.innerHTML = "";

    const currentUser = JSON.parse(atob(token.split(".")[1])).sub;

    let rank =1;

    data.forEach((u, index) => {
        if(index > 0 && u.score < data[index - 1].score){
            rank = index + 1;
        }
        const highlight = u.user === currentUser ? "style='color: #38bdf8'" : "";

        container.innerHTML += `
        <p ${highlight}>#${rank} ${u.user}: ${u.score}</p>
        `;
    });
}

//----------------------------------------------------------------------------------------------------------------------------


async function loadChallenges(){
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/challenges`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();

    const category = document.getElementById("category-filter")?.value || "";
    const difficulty = document.getElementById("difficulty-filter")?.value || "";

    let filtered = data;

    if(category){
        filtered = filtered.filter(c => c.category === category);
    }
    if(difficulty){
        filtered = filtered.filter(c => c.difficulty === difficulty);
    }

    const container = document.getElementById("challenges");
    container.innerHTML = "";

    filtered.forEach(c=> {
        const disabled = c.solved ? "disabled" : "";
        const opacity = c.solved ? "0.5" : "1";

        container.innerHTML += `
         <div class="card" style="opacity:${opacity}">
             <h3>${c.title} (${c.points} pts)</h3>
             <p>${c.description}</p>
             <p>Status: ${c.solved ? "Solved:) !!!" : "Not solved bruh (-_-)"}</p>
             <input id="flag-${c.id}" placeholder="Enter Flag" ${disabled}>
             <button onclick="submitFlag(${c.id})" ${disabled}>Submit</button>
             <button onclick="getHints(${c.id})" ${disabled}>Hints</button>
             <div id="hints-${c.id}" style="margin-top:10px; color:#94a3b8;"></div>
             <p id="result-${c.id}"></p>
             <hr>
         </div>
        `;
    });
    
    updateProgress();
}

//----------------------------------------------------------------------------------------------------------------------------

async function createChallenge(){
    const token = localStorage.getItem("token");

    const data = {
        title: document.getElementById("title").value,
        description: document.getElementById("desc").value,
        flag: document.getElementById("flag").value,
        points: parseInt(document.getElementById("points").value),
        category: document.getElementById("category").value,
        difficulty: document.getElementById("difficulty").value,
        hints: document.getElementById("hints").value
         .split(",")
         .map(h => h.trim())
    };

    const res= await fetch(`${API}/admin/create`, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    document.getElementById("msg").innerText = result.message;

    loadAdminChallenges();
}

//-----------------------------------------------------------------------------------------------------------------------------

async function loadAdminChallenges(){
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/admin/challenges`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data =await res.json();
    const container = document.getElementById("admin-challenges");
    container.innerHTML = "";

    data.forEach(c =>{
        container.innerHTML += `
       <div class="card">
        <h4>${c.title}</h4>
        <p>${c.category} | ${c.difficulty}</p>
        <p>${c.points} pts</p>
        <button onclick="deleteChallenge(${c.id})">DELETE</button>
       </div>
        `;
    });

    const search = document.getElementById("search")?.valuetoLowerCase() || "";
    if(search){
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(search) ||
            c.description.toLowerCase().includes(search)
        );
    }
}

//-----------------------------------------------------------------------------------------------------------------------------

async function deleteChallenge(id){
    const token = localStorage.getItem("token");

    await fetch(`${API}/admin/delete/${id}`, {
        method: "DELETE",
        headers:{
            "Authorization": `Bearer ${token}`
        }
    });

    loadAdminChallenges();
}

//-----------------------------------------------------------------------------------------------------------------------------

function loadUser(){
    const token = localStorage.getItem("token");
    const payload = JSON.parse(atob(token.split(".")[1]));
    document.getElementById("username-display").innerText = "User: " + payload.sub;
}

//-----------------------------------------------------------------------------------------------------------------------------

async function loadSolvedCount(){
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/solved`, {
        headers: {"Authorization": `Bearer ${token}`}
    });

    const data = await res.json();
    
    document.getElementById("username-display").innerText +=
    `| Solved: ${data.solved.length}`;
}

//-----------------------------------------------------------------------------------------------------------------------------

async function updateProgress(){
    const token = localStorage.getItem("token");

    const solvedRes = await fetch(`${API}/solved`, {
        headers: {"Authorization": `Bearer ${token}`}
    });

    const challengesRes = await fetch(`${API}/challenges`, {
        headers: {"Authorization": `Bearer ${token}`}
    });

    const solved = (await solvedRes.json()).solved.length;
    const total = (await challengesRes.json()).length;
    const percent = total ? (solved / total) * 100 : 0;

    document.getElementById("progress-fill").style.width = percent + "%"
}

//-----------------------------------------------------------------------------------------------------------------------------
if(window.location.pathname.includes("dashboard.html")){
    loadChallenges();
    loadUser();
    loadSolvedCount();
    updateProgress();
}

if(window.location.pathname.includes("admin.html")){
    loadAdminChallenges();
}


