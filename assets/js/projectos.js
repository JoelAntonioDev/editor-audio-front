  const emailDisplay = document.getElementById("email-display");
  emailDisplay.textContent = localStorage.getItem("email");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Listar projectos");
  
    // Buscar email do LocalStorage
    let email = localStorage.getItem("email");
    
    if (!email) {
      console.log("Nenhum email encontrado no LocalStorage. Buscando nos Cookies...");
      email = getCookie("email");
    }
  
    if (!email) {
      console.log("Nenhum email encontrado. Redirecionando para login...");
      window.location.href = "./../index.html";
      return;
    }
  
    console.log("Email encontrado:", email);
    document.getElementById("email-display").textContent = email;
    
    // Buscar token do LocalStorage ou Cookies
    let token = localStorage.getItem("token") || getCookie("token");
  
    if (!token) {
      console.log("Nenhum token encontrado. Redirecionando para login...");
      window.location.href = "./../index.html";
      return;
    }
  
    console.log("Token encontrado:", token);
  
    fetch("http://localhost:8000/api/projectos", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.status === "erro") {
          console.error("Erro de autenticação:", data.message);
          alert("Sessão expirada. Faça login novamente.");
          if (data.message.includes("expirado") || data.message.includes("negado")) {
            alert("Sessão expirada. Faça login novamente.");
            logout();  
          }
          return;
        }
        mostrarProjectos(data.projectos);
      })
      .catch((error) => console.error("Erro ao buscar projetos:", error));
  });
  
  function getCookie(name) {
    let cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      let [key, value] = cookie.split("=");
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
  
  
  function mostrarProjectos(projectos) {
    const lista = document.getElementById("lista-projectos");
    lista.innerHTML = "";
  
    projectos.forEach((proj) => {
      let item = document.createElement("li");
  
      // Criar um link <a> para abrir o projeto
      let link = document.createElement("a");
      link.textContent = proj.project_name;
      link.href = `./home.html?project_id=${proj.id}`; 
      link.style.textDecoration = "none";
      link.style.color = "blue"; 
      link.target = "_self";
  
      // Criar botão de excluir
      let botaoExcluir = document.createElement("button");
      botaoExcluir.textContent = "Excluir";
      botaoExcluir.style.marginLeft = "10px";
      botaoExcluir.style.color = "white";
      botaoExcluir.style.backgroundColor = "red";
      botaoExcluir.style.border = "none";
      botaoExcluir.style.padding = "5px 10px";
      botaoExcluir.style.cursor = "pointer";
      botaoExcluir.style.borderRadius = "5px";
      botaoExcluir.style.float = "right";

  
      // Definir o ID do projeto no botão
      botaoExcluir.dataset.projectId = proj.id;
  
      botaoExcluir.addEventListener("click", function () {
        excluirProjecto(proj.id);
      });
  
      // Adicionar elementos à lista
      item.appendChild(link);
      item.appendChild(botaoExcluir);
      lista.appendChild(item);
    });
  
    if (projectos.length === 0) {
      const info = document.createElement("h1");
      info.textContent = "Nenhum projecto guardado";
      lista.appendChild(info);
    }
  }
  
  // Função para excluir um projeto
  function excluirProjecto(projectId) {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) {
      return; 
    }
    let token = localStorage.getItem("token") || getCookie("token");
  
    fetch(`http://localhost:8000/api/projectos/${projectId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "sucesso") {
          alert("Projeto excluído com sucesso!");
          location.reload(); 
        } else {
          alert("Erro ao excluir: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Erro ao excluir o projeto:", error);
        alert("Erro ao excluir o projeto.");
      });
  }
  

  function logout() {
    // Buscar o token do LocalStorage ou Cookies
    const token = localStorage.getItem("token") || getCookie("token");

    if (token) {
        // Enviar requisição de logout para o back-end
        fetch('http://localhost:8000/api/auth/logout', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                console.log("Logout bem-sucedido:", data.message);

                // Remover token do LocalStorage
                localStorage.removeItem("token");
                localStorage.removeItem("email");

                // Remover token dos Cookies (expirando imediatamente)
                document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                document.cookie = "email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

                // Redirecionar para a página de login
                window.location.href = "./../index.html";
                console.log(document.cookie);
            } else {
                console.error("Erro ao fazer logout:", data.message);
            }
        })
        .catch(error => {
            console.error("Erro na requisição de logout:", error);
        });
    } else {
        // Token ausente, remover do LocalStorage e Cookies mesmo assim
        localStorage.removeItem("token");
        localStorage.removeItem("email");

        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        document.cookie = "email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

        // Redirecionar para a página de login
        window.location.href = "./../index.html";
    }
  }

  function abrirModal() {
    document.getElementById("modal").style.display = "flex";
  }

  // Função para fechar o modal
  function fecharModal() {
    document.getElementById("modal").style.display = "none";
  }

  function criarProjecto() {
    const titulo = document.getElementById("titulo").value;
    const audio = document.getElementById("audio").files[0];
    let token = localStorage.getItem("token") || getCookie("token");
    if (!titulo || !audio) {
      alert("Preencha todos os campos!");
      return;
    }

    let formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("audio", audio);

    fetch("http://localhost:8000/api/projectos", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === "sucesso") {
        alert("Projeto criado com sucesso!");
        fecharModal();
        window.location.reload(); 
      } else {
        alert("Erro: " + data.message);
      }
    })
    .catch(error => console.error("Erro ao criar projeto:", error));
  }

