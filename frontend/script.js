const API = window.location.origin;

function safe(str){
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
    
}

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
    
    if(!flag){
        showToast("Enter a flag bruh(-_-)");
        return;
    }

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
    showToast(data.message);
    
    if(data.message.includes("Correct")){
        showToast("🩸 FIRST BLOOD!", "success")
        const card = document.getElementById(`flag-${id}`).closest(".card");

        card.style.opacity = "0.5";
        card.style.pointerEvents = "none";

        card.querySelector("input").disabled = true;
        card.querySelectorAll("button").forEach(btn => btn.disabled = true);

        if(!card.querySelector(".solved-badge")){
            card.innerHTML += "<p class='solved-badge' style='color: #22c55e;'>Solved</p>";
        }
    }
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
    container.innerHTML = data.hints.map(h => `<p>
        Hint(${h.cost} pts):
        <span data-hint="${encodeURIComponent(h.hint)}" data-cost="${h.cost}" onclick="unlockHint(this)" style="cursor:pointer; color:#38bdf8;">
           Click to unlock
        </span>
    </p>`).join("");
    
    const card = document.getElementById(`hints-${id}`).closest(".card");
    card.querySelector(`button[onclick="getHints(${id})"]`).style.display = "none"
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

    if(data.length === 0){
        container.innerHTML = "<p>No scores yet:( </p>";
        return;
    }

    const currentUser = JSON.parse(atob(token.split(".")[1])).sub;

    let rank =1;
    let userRank=null;

    data.forEach((u, index) => {
        if(index > 0 && u.score < data[index - 1].score){
            rank = index + 1;
        }

        if(u.user === currentUser){
            userRank = rank;
        }
        const highlight = u.user === currentUser ? "style='color: #00ad20'" : "";

        let medal = "";

        if(rank === 1) medal ="🥇";
        else if(rank === 2) medal = "🥈";
        else if(rank === 3) medal = "🥉";

        container.innerHTML += `
        <p ${highlight}>${medal} #${rank} ${u.user}: ${u.score}</p>
        `;
    });

    if(userRank !== null){
        container.innerHTML += `
        <p style="margin-top:15px; color:#22c55e;">
            You are ranked #${userRank}
        </p>        
        `;
    }
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

    const sort  = document.getElementById("sort-filter")?.value;

    if(sort === "points"){
        filtered.sort((a,b) => b.points - a.points);
    }
    else if(sort === "solves"){
        filtered.sort((a,b) => b.solve_count - a.solve_count);
    }

    const search = document.getElementById("search")?.value.toLowerCase() || "";
    if(search){
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(search) ||
            c.description.toLowerCase().includes(search)
        );
    }

    if(category){
        filtered = filtered.filter(c => c.category === category);
    }
    if(difficulty){
        filtered = filtered.filter(c => c.difficulty === difficulty);
    }

    const container = document.getElementById("challenges");
    container.innerHTML = "";

    if(filtered.length === 0){
        container.innerHTML = "<p>NO Challenges Found(ToT)</p>";
        return;
    }

    filtered.forEach((c, index) => {
        const disabled = c.solved ? "disabled" : "";
        const opacity = c.solved ? "0.5" : "1";

        const color = c.difficulty === "Easy" ? "#22c55e":
                      c.difficulty === "Medium" ? "#facc15" :
                      "#ef4444";

        container.innerHTML += `
         <div class="card" style="opacity:${opacity}; pointer-events:${c.solved ? "none" : "auto"}">
             <h3>#${index+1} ${c.title} (${c.points} pts)</h3>
             <p>${c.description}</p>
             <p style="color:${color}">${c.difficulty}</p>
             ${c.first_solver ? `<p style="color: #ef4444;">🩸 First Blood: ${c.first_solver}</p>` : ""}
             <p style="color:#94a3b8;">Solved by: ${c.solve_count} ${c.solve_count === 1 ? "player" : "players"}</p>
             <p>Status: ${c.solved ? "Solved:) !!!" : "Not solved bruh (-_-)"}</p>
             ${c.solved ? "<span style='color: #22c55e; font-weight:bold;'>Completed</span>": ""}
             <input id="flag-${c.id}" placeholder="Enter Flag" onkeydown="if(event.key==='Enter'){submitFlag(${c.id})}" ${disabled}>
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

    const hintsInput = document.getElementById("hints").value;

    const hints = hintsInput ? hintsInput.split(",").map(h => h.trim()).filter(h => h) : [];

    const data = {
        title: document.getElementById("title").value,
        description: document.getElementById("desc").value,
        flag: document.getElementById("flag").value,
        points: parseInt(document.getElementById("points").value),
        category: document.getElementById("category").value,
        difficulty: document.getElementById("difficulty").value,
        hints: hints
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
        <button onclick="editChallenge(${c.id}, '${safe(c.title)}', '${safe(c.description)}', '${safe(c.flag)}', ${c.points}, '${c.category}', '${c.difficulty}')">EDIT</button>
        <button onclick="deleteChallenge(${c.id})">DELETE</button>
       </div>
        `;
    });
}

//-----------------------------------------------------------------------------------------------------------------------------

async function deleteChallenge(id){
    if(!confirm("Are you sure you want to delete this challenge??")){
        return;
    }

    const token = localStorage.getItem("token");

    await fetch(`${API}/admin/delete/${id}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${token}`}
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
    ` | Solved: ${data.solved.length}`;
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
    const percent = total ? Math.min((solved / total) * 100, 100) : 0;

    document.getElementById("progress-fill").style.width = percent + "%"
}

//-----------------------------------------------------------------------------------------------------------------------------

function showToast(msg, type ="success"){
    const toast = document.getElementById("toast");
    toast.innerText = msg;

    if(type === "error"){
        toast.style.borderLeft = "4px solid #ef4444";
    }
    else{
        toast.style.borderLeft = "4px solid #22c55e"
    }

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    },2000);
}

//-----------------------------------------------------------------------------------------------------------------------------

function logout(){
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

//-----------------------------------------------------------------------------------------------------------------------------

async function loadActivity(){
    const res = await fetch(`${API}/solves`);
    const solves = await res.json();

    const token = localStorage.getItem("token");

    const challengesRes = await fetch(`${API}/challenges`, {
        headers: {"Authorization": `Bearer ${token}`}
    });

    const challenges = await challengesRes.json();

    const map = {};
    challenges.forEach(c => {
        map[c.id] = c.title;
    });

    const container = document.getElementById("activity");
    container.innerHTML = "";

    solves.slice(-5).reverse().forEach(s => {
        container.innerHTML += `
        <p> ${s.user} solved "${map[s.challenge_id] || "Unknown Challenge"}"</p>
        `;
    });
}

//-----------------------------------------------------------------------------------------------------------------------------

function editChallenge(id, title, description, flag, points, category, difficulty){
    const newTitle = prompt("Title:", title) || title;
    const newDesc = prompt("Description:", description) || description;
    const newFlag = prompt("Flag:", flag) || flag;
    const flag_for_user = "ZmxhZ3tiYXNlNjRfaXNfbm90X2VuY3J5cHRpb259";
    const newPoints = prompt("Points:", points) || points;
    const hintsInput = prompt("Hints (comma seperated):", "");
    let hints = [];
    if (hintsInput && hintsInput.trim() !== ""){
        hints = hintsInput.split(",").map(h => h.trim()).filter(h => h.length > 0);
    }
    

    fetch(`${API}/admin/edit/${id}`,{
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
            title: newTitle,
            description: newDesc,
            flag: newFlag,
            points: parseInt(newPoints),
            category,
            difficulty,
            hints: hints
        })
    })
    .then(res => {
        if (!res.ok){
            console.log("FAILED STATUS:", res.status);
        }
        return res.json();
    })
    .then(data => {
        console.log("SERVER RESPONSE:", data);
        alert(data.message || data.detail);
        location.reload();
    });
}

//-----------------------------------------------------------------------------------------------------------------------------

function signup(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch(`${API}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password})
    })
    .then(res => res.json())
    .then(data => {
        const msg = document.getElementById("msg");
         
        if (data.msg){
            msg.style.color = "#22c55e";
            msg.innerText = data.msg;

            showToast("Sign-up successful", "success");

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);
        }
        else {
            msg.style.color = "#ef4444";
            msg.innerHTML = `${data.detail} - <a href="login.html" style="color:#38bdf8">Login</a>`

            showToast(data.detail, "error")
        }
    });
    
}

//-----------------------------------------------------------------------------------------------------------------------------

function togglePassword(){
    const input = document.getElementById("password");
    const icon = document.getElementById("eyeIcon");
    

    if(input.type === "password"){
        input.type = "text";
        icon.src = "assets/eye-open.png";
    }
    else{
        input.type = "password";
        icon.src = "assets/eye-closed.png";
    }
}


//-----------------------------------------------------------------------------------------------------------------------------

function showChallenges(){
    document.getElementById("challenges-section").style.display = "block";
    document.getElementById("scoreboard-section").style.display = "none";
    loadChallenges();
}

//-----------------------------------------------------------------------------------------------------------------------------

function showScoreboard(){
    document.getElementById("challenges-section").style.display = "none";
    document.getElementById("scoreboard-section").style.display = "block";
    loadScoreboard(); 
}

//------------------------------------------------------------------------------------------------------------------------------

async function unlockHint(el){

    const token = localStorage.getItem("token");

    const hint = decodeURIComponent(el.dataset.hint);
    const cost = parseInt(el.dataset.cost);
    const id = el.closest(".card").querySelector("input").id.split("-")[1];

    const res = await fetch(`${API}/use-hint`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            challenge_id: id,
            hint: hint,
            cost: cost
        })
    });

    const data = await res.json();

    if (res.ok){
        el.innerText = hint;
    }
    else {
        showToast(data.detail || "Hint failed", "error");
    }
}

//------------------------------------------------------------------------------------------------------------------------------
if(window.location.pathname.includes("dashboard.html")){
    loadChallenges();
    loadUser();
    loadSolvedCount();
    updateProgress();
    loadActivity();
}

if(window.location.pathname.includes("admin.html")){
    loadAdminChallenges();
}


