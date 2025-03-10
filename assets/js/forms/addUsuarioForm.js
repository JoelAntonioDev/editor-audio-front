
document.getElementById("addUsuarioForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    console.log("entrou");
    const nome = document.getElementById("nomeUsuario").value.trim();
    const sobrenome = document.getElementById("sobrenome").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const passwordConfirm = document.getElementById("passwordConfirm").value.trim();

    // Validações
    if (!nome || !sobrenome || !email || !password || !passwordConfirm) {
        alert("Todos os campos devem ser preenchidos.");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Por favor, insira um e-mail válido.");
        return;
    }

    if (password.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    if (password !== passwordConfirm) {
        alert("As senhas não coincidem.");
        return;
    }

    try {
        
        const response = await fetch("http://localhost:8000/api/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, sobrenome, email, password })
        });
        const result = await response.json();
        if (response.ok) {
            alert("Conta criada com sucesso! Redirecionando para login...");
            setTimeout(() => {
                window.location.href = "./../index.html";
            }, 1000);
        } else {
            alert("Erro: " + result.message);
        }
    } catch (error) {
        alert("Erro ao conectar ao servidor. Tente novamente mais tarde.");
    }
});
