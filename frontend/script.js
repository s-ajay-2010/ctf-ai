const API = "https://127.0.0.1";

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

}

