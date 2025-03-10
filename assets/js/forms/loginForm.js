document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    
    if (!email || !password) {
        alert("Todos os campos devem ser preenchidos.");
        return false;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Por favor, insira um e-mail válido.");
        return false;
    }
    
    try {
        const response = await fetch("http://localhost:8000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
    
        const result = await response.json(); 
    
        if (response.ok) {
            console.log(result); 
    
            // Armazena dados no LocalStorage
            localStorage.setItem("token", result.token);
            localStorage.setItem("email", result.email);
            localStorage.setItem("is_admin", result.is_admin);
            console.log("Token salvo:", localStorage.getItem("token"));
            console.log("Email salvo:", localStorage.getItem("email"));
            console.log("Admin:", localStorage.getItem("is_admin"));
            
            // Salvar token e status de admin nos Cookies (expira em 1 hora)
            document.cookie = `token=${result.token}; path=/; max-age=3600;`;
            document.cookie = `email=${result.email}; path=/; max-age=3600;`;
            document.cookie = `is_admin=${result.is_admin}; path=/; max-age=3600;`;

            alert("Login realizado com sucesso!");

            setTimeout(() => {
                if (result.is_admin) {
                    window.location.href = "./pages/admin.html";
                } else {
                    window.location.href = "./pages/projectos.html";
                }
            }, 1000);
        } else {
            alert("Erro: " + result.message);
        }
    } catch (error) {
        alert("Erro ao conectar ao servidor. Tente novamente mais tarde.");
    }
    
    return false;
});

document.getElementById("registerBtn").addEventListener("click", function() {
    window.location.href = "./pages/criar_conta.html";
});
