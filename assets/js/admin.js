document.addEventListener("DOMContentLoaded", function () {
  carregarUsuarios();
});

async function carregarUsuarios() {
  document.getElementById("titulo-secao").textContent = "Gerenciamento de Usuários";
  const listaDados = document.getElementById("lista-dados");
  const mensagem = document.getElementById("mensagem");

  let token = localStorage.getItem("token") || getCookie("token");

  if (!token) {
    window.location.href = "./index.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:8000/api/admin/usuarios", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    const result = await response.json();
    listaDados.innerHTML = "";

    if (response.ok) {
      if (result.usuarios.length === 0) {
        mensagem.innerHTML = "<p>Nenhum usuário encontrado.</p>";
        return;
      }

      result.usuarios.forEach((user) => {
        const li = document.createElement("li");
        li.innerHTML = `${user.email} (${user.is_admin ? "Admin" : "Usuário"})`;
        listaDados.appendChild(li);
      });
    } else {
      mensagem.innerHTML = `<p class="erro">${result.message}</p>`;
    }
  } catch (error) {
    mensagem.innerHTML = `<p class="erro">Erro ao buscar usuários.</p>`;
  }
}

async function carregarHistorico() {
  document.getElementById("titulo-secao").textContent = "Histórico de Atividades";
  const listaDados = document.getElementById("lista-dados");
  const mensagem = document.getElementById("mensagem");

  let token = localStorage.getItem("token") || getCookie("token");

  if (!token) {
    window.location.href = "./index.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:8000/api/admin/historico", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    const result = await response.json();
    listaDados.innerHTML = "";

    if (response.ok) {
      if (result.historico.length === 0) {
        mensagem.innerHTML = "<p>Nenhuma atividade encontrada.</p>";
        return;
      }

      result.historico.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${item.usuario}</strong>: ${item.tipo_atividade} em ${item.timestamp} (${item.descricao})`;
        listaDados.appendChild(li);
      });
    } else {
      mensagem.innerHTML = `<p class="erro">${result.message}</p>`;
    }
  } catch (error) {
    mensagem.innerHTML = `<p class="erro">Erro ao buscar histórico.</p>`;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = "../index.html";
}

// Função para obter o valor de um cookie
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


