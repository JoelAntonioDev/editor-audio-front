let step = 1;
document.addEventListener("DOMContentLoaded", async () => {
  if (!localStorage.getItem("guideCompleted")) {
    document.getElementById("guideOverlay").style.display = "block";
    showGuide(step++);
  }
  const emailDisplay = document.getElementById("email-display");
  emailDisplay.textContent =
    getCookie("email") || localStorage.getItem("email");
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project_id");
  const audioElement = document.getElementById("audio");
  const bar = document.querySelector(".bar");
  const mixer = document.querySelector(".mixer");
  const timeListContainer = document.querySelector(".time-reproducer");
  const btnSalvarProjecto = document.getElementById("btn-c3");
  const audioUI = new AudioUI(audioElement, timeListContainer);

  window.audioManager = new AudioManager(audioElement, bar, mixer, audioUI);

  window.audioManager.attachListeners();
  audioUI.updateTimeDisplay();
  audioUI.generateTimeList();

  if (!projectId) {
    alert("Projeto não encontrado!");
    return;
  }

  console.log("Carregando projeto ID:", projectId);
  await carregarAudioDoServidor(projectId);


  btnSalvarProjecto.addEventListener("click", () => {
    showToast("Começou o download!", 2000);
    baixarProjeto(projectId);
  });
});

async function carregarAudioDoServidor(projectId) {
  try {
    let token = localStorage.getItem("token") || getCookie("token");
    if (!token) {
      alert("Usuário não autenticado!");
      window.location.href = "./../index.html";
      return;
    }

    const response = await fetch(
      `http://localhost:8000/api/projectos/${projectId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("Resposta da API:", result);

      if (!result.projecto) {
        alert(`Erro: ${result.message}`);
        document.getElementById("project-title").textContent =
        result.project_name;
        return;
      }

      // Definir o título do projeto
      document.getElementById("project-title").textContent =
        result.projecto.project_name;

      if (!result.projecto.arquivos || result.projecto.arquivos.length === 0) {
        alert("Nenhum arquivo de áudio encontrado para este projeto.");
        return;
      }

      console.log("Arquivos encontrados:", result.projecto.arquivos);

      
      for (let arquivo of result.projecto.arquivos) {
        if (!arquivo.audio_url) {
          console.warn(`Arquivo ${arquivo.audio_id} não possui uma URL válida.`);
          continue;
        }

        console.log("Carregando áudio:", arquivo.audio_url);

        const audioResponse = await fetch(arquivo.audio_url);
        if (!audioResponse.ok) {
          console.error("Erro ao carregar áudio:", arquivo.audio_url);
          continue;
        }

        const audioBlob = await audioResponse.blob();
        
        const file = new File([audioBlob], arquivo.file_name, {
          type: audioBlob.type,
        });

        audioManager.loadAudio(file);
      }

      console.log("Todos os áudios foram carregados com sucesso.");
    } else {
      alert("Erro ao buscar projeto: " + (result.message || "Erro desconhecido"));
    }
  } catch (error) {
    console.error("Erro ao buscar os áudios:", error);
    alert("Erro ao conectar ao servidor.");
  }
}



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

function verProjectos(){
  window.location.href="./projectos.html";
}
function logout() {
  // Buscar o token do LocalStorage ou Cookies
  const token = localStorage.getItem("token") || getCookie("token");

  if (token) {
    // Enviar requisição de logout para o back-end
    fetch("http://localhost:8000/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "sucesso") {
          console.log("Logout bem-sucedido:", data.message);

          // Remover token do LocalStorage
          localStorage.removeItem("token");
          localStorage.removeItem("email");

          // Remover token dos Cookies (expirando imediatamente)
          document.cookie =
            "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
          document.cookie =
            "email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

          // Redirecionar para a página de login
          window.location.href = "../index.html";
          console.log(document.cookie);
        } else {
          console.error("Erro ao fazer logout:", data.message);
        }
      })
      .catch((error) => {
        console.error("Erro na requisição de logout:", error);
      });
  } else {
    localStorage.removeItem("token");
    localStorage.removeItem("email");

    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

    // Redirecionar para a página de login
    window.location.href = "./../index.html";
  }
}


function actualizarPagina() {
  console.log("Atualizando página em 3 segundos...");
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

async function baixarProjeto(projectId) {
  let token = localStorage.getItem("token") || getCookie("token");

  try {
    const response = await fetch(
      `http://localhost:8000/api/baixar-projecto/${projectId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao baixar o projeto");
    }

    // Criar um Blob para o arquivo ZIP
    const blob = await response.blob();

    // Criar um link temporário e disparar o download diretamente
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projeto_${projectId}.zip`;
    a.style.display = "none"; // Esconder o link
    document.body.appendChild(a);
    a.click(); // Aciona o clique automaticamente
    document.body.removeChild(a); // Remove o link após o download

    // Liberar memória
    window.URL.revokeObjectURL(url);
    showToast("Download feito!", 1000);
  } catch (error) {
    console.error("Erro:", error.message);
    alert("Falha ao baixar o projeto. Tente novamente.");
  }
}

function showToast(message, duration = 3000) {
  const toastContainer = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;

  toastContainer.appendChild(toast);

  // Mostrar o toast
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  // Remover o toast após a duração especificada
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 500);
  }, duration);
}

function showGuide(step) {
  let modal = document.getElementById(`guide${step}`);
  let button = document.querySelector(`.btn-g${step}`);

  // Pegar posição do botão
  let rect = button.getBoundingClientRect();
  let modalTop = rect.top + window.scrollY - modal.offsetHeight - 50; // Acima do botão
  let modalLeft = rect.left + window.scrollX + button.offsetWidth / 2 - modal.offsetWidth / 2 - 50; // Centralizado

  // Ajuste de bordas da tela
  if (modalLeft < 10) modalLeft = 5;
  let maxRight = window.innerWidth - modal.offsetWidth - 10;
  if (modalLeft > maxRight) modalLeft = maxRight;

  // Ajusta posição do modal
  modal.style.display = "block";
  modal.style.top = `${modalTop}px`;
  modal.style.left = `${modalLeft}px`;

  // Atualiza a posição da seta
  let arrow = modal.querySelector("::after");
  let arrowLeft = rect.left + button.offsetWidth / 2 - modalLeft - 20; // Ajuste do meio

  // Ajusta a seta dinamicamente
  modal.style.setProperty("--arrow-left", `${arrowLeft}px`);
}

// Ajuste para cada modal
document.styleSheets[0].insertRule(`
  .guide::after {
    left: var(--arrow-left, 50%);
    top: 100%;
    transform: translateX(-50%);
    border-color: white transparent transparent transparent;
  }
`, document.styleSheets[0].cssRules.length);


function nextGuide(step) {
  document.getElementById(`guide${step}`).style.display = "none";

  if (step < 6) {
    showGuide(step + 1);
  } else {
    localStorage.setItem("guideCompleted", "true");
    document.getElementById("guideOverlay").style.display = "none";
  }
}
