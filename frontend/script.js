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
        window.location.href = "dashboard.html";
    }
    else{
        document.getElementById("msg").innerText = data.detail;
    }

    const container = document.getElementById("challenges");
    container.innerHTML = "";

    data.forEach(c => {
        container.innerHTML += `
         <div>
             <h3>${c.title} (${c.points} pts)</h3>
             <p>${c.description}</p>
             <p>Status: ${c.solved ? "Solved!!" : "Not solved bruh (-_-)"}</p>

             <input id="flag-${c.id}" placeholder="Enter flag">{/*</input>*/}
             <button onclick="submitFlag(${c.id})">Submit</button>
             <button onclick="getHints(${c.id})">Hints</button>

             <p id="result-${c.id}"></p>
             <hr>
         </div>
        `;
    });

}

//---------------------------------------------------------------------------------------------

async function submitFlag(id) {
    const token = localStorage.getItem("token");
    const flag = document. getElementById(`flag-${id}`).value;

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


//-----------------------------------------------------------------------------------------

async function getHints(id){
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/hints/${id}`,{
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();
    const container = document.getElementsById(`hints-${id}`);
    container.innerHTML = data.hints.map(h => `<p>Hint: ${h}</p>`).join("");
    
    document.querySelector(`button[onclick="getHints(${id})"]`).style.display = "none";
}

//----------------------------------------------------------------------------------------------


async function loadScoreboard(){
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/scoreboard`,{
        headers:{
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();
    const container = document.getElementById("scoreboard");
    container.innerHTML = "";

    data.forEach(u=>{
        container.innerHTML += `<p>${u.user}: ${u.score}</p>`;
    });
}

//-------------------------------------------------------------------------------------------


async function loadChallenges(){
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/challenges`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();
    const container = document.getElementById("challenges");
    container.innerHTML = "";

    data.forEach(c=> {
        const disabled = c.solved ? "disabled" : "";
        const opacity = c.solved ? "0.5" : "1";

        container.innerHTML += `
         <div style="opacity:${opacity}">
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
}

//-----------------------------------------------------------------------------------------


if(window.location.pathname.includes("dashboard.html")){
    loadChallenges();
}


