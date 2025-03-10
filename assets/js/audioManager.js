class AudioManager {
  constructor(audioElement, bar, mixer, audioUI) {
    this.audio = audioElement;
    this.bar = bar;
    this.mixer = mixer;
    this.isMoving = false;
    this.offsetX = 0;
    this.audioUI = audioUI;
    this.btnAddAudio = document.getElementById("btn-c1");
    this.faixaFile = document.getElementById("faixaFile");
    this.btnRecortar = document.getElementById("recortar");
    this.btnMesclar = document.getElementById("btn-c8");
    this.btnMesclar2 = document.querySelector(".btn-g7");
    this.btnEfeito = document.querySelector(".btn-gg4");
    this.btnEfeito2 = document.querySelector(".btn-g10");    
    this.btnAlongar = document.getElementById("btn-c9");
    this.btnAlongar2 = document.querySelector(".btn-g8");
    this.btnRestart = document.getElementById("btn-restart");
    this.btnRetrocederEdicao = document.getElementById("btn-c4");
    this.btnRetrocederEdicao2 = document.querySelector(".btn-g9");
    this.actionSelect = document.getElementById("actionSelect");
    this.fileSelector = document.getElementById("fileSelectorA");
    this.fileSelectorContainer = document.getElementById("fileSelectorContainer");
    this.timeFields = document.getElementById("timeFields");
    this.submitButton = document.getElementById("submitButton");
    this.btnPlay = document.getElementById("btn-play");
    this.btnPause = document.getElementById("btn-pause");
    this.btnStop = document.getElementById("btn-stop");
    this.btnPrev = document.getElementById("btn-prev");
    this.btnPos = document.getElementById("btn-pos");
    this.form = document.getElementById("audioForm");
    this.modalA = document.getElementById("audioModalA");
    this.closeModalBtn = document.querySelector(".close");
    this.handleFileChange = this.handleFileChange.bind(this);

  }

  changeButtonColor(button) {
    button.style.backgroundColor = "lightgreen";
    setTimeout(() => {
      button.style.backgroundColor = "";
    }, 3000);
  }

  seekAudio(seconds) {
    const allAudioElements = document.querySelectorAll("audio");

    allAudioElements.forEach(audio => {
      if (!audio.paused && !audio.ended) {
        let newTime = audio.currentTime + seconds;
        if (newTime < 0) {
          newTime = 0;
        } else if (newTime > audio.duration) {
          newTime = audio.duration;
        }
        audio.currentTime = newTime;
        console.log(`Áudio atualizado para: ${newTime} segundos`);
      }
    });
  }
  handleFileChange(event) {
    event.preventDefault();
    const file = this.faixaFile.files[0];
    if (file) {
      console.log("Chamando uploadAudio");
      this.uploadAudio(file);
    }
  }


  play() {
    this.audio.play();
  }
  reproduzirTodos() {
    const allAudioElements = document.querySelectorAll("audio");

    if (allAudioElements.length === 0) {
      console.log("Nenhum áudio encontrado para reproduzir.");
      return;
    }

    allAudioElements.forEach(audio => {
      audio.play().catch(error => console.error("Erro ao reproduzir áudio:", error));
    });

    document.querySelector(".audio-mixer-status").innerText = "[TOCANDO TODOS]";
    console.log("Todos os áudios estão sendo reproduzidos!");
  }

  pausarTodos() {
    const allAudioElements = document.querySelectorAll("audio");

    if (allAudioElements.length === 0) {
      console.log("Nenhum áudio encontrado para pausar.");
      return;
    }
    document.querySelector(".audio-mixer-status").innerText = "[PAUSANDO TODOS]";
    allAudioElements.forEach(audio => {
      if (audio && typeof audio.pause === "function") {
        audio.pause();
        console.log(`Áudio pausado: ${audio.src}`);
      } else {
        console.warn("Elemento de áudio inválido encontrado:", audio);
      }
      document.querySelector(".audio-mixer-status").innerText = "[PAUSADOS]";
    });

    console.log("Todos os áudios estão pausados!");
  }

  zerarTodos() {
    const allAudioElements = document.querySelectorAll("audio");

    if (allAudioElements.length === 0) {
      console.log("Nenhum áudio encontrado para zerar.");
      return;
    }

    allAudioElements.forEach(audio => {
      audio.currentTime = 0;
      audio.pause();
    });

    console.log("Todos os áudios estão zerados!");
  }
  reiniciarTodos() {
    const allAudioElements = document.querySelectorAll("audio");

    if (allAudioElements.length === 0) {
      console.log("Nenhum áudio encontrado para reiniciar.");
      return;
    }

    allAudioElements.forEach(audio => {
      audio.currentTime = 0;
    });

  }
  async loadAudio(file) {
    try {
      this.audioUI.showLoadingModal(file);

      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);

      fileReader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          this.audioUI.actualizarProgresso(percent);
        }
      };

      fileReader.onload = async () => {
        const arrayBuffer = fileReader.result;
        const audioBuffer = await this.audioContext.decodeAudioData(
          arrayBuffer
        );

        this.audioBuffers.push(audioBuffer);
        this.audioFileNames.push(file.name);
        const wavBlob = this.bufferToWaveBlob(audioBuffer);
        const audioURL = URL.createObjectURL(wavBlob);

        console.log("Áudio carregado!");
        this.showToast("Áudio carregado com sucesso", 1000, "sucesso");
        this.fileName = file.name;
        this.audioUI.createSoundTimeController(
          audioURL,
          file.name,
          audioBuffer
        );
        this.audioUI.hideLoadingModal();
      };

      fileReader.onerror = (error) => {
        console.error("Erro ao carregar o arquivo:", error);
        this.audioUI.hideLoadingModal();
      };
    } catch (error) {
      console.error("Erro ao processar o arquivo:", error);
      this.audioUI.hideLoadingModal();
    }
  }

  bufferToWaveBlob(audioBuffer) {
    const numOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeUTFBytes(view, 0, "RIFF");
    view.setUint32(4, 36 + audioBuffer.length * numOfChannels * 2, true);
    this.writeUTFBytes(view, 8, "WAVE");

    // FMT sub-chunk
    this.writeUTFBytes(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * numOfChannels * 2, true);
    view.setUint16(32, numOfChannels * 2, true);
    view.setUint16(34, 16, true);

    // Data sub-chunk
    this.writeUTFBytes(view, 36, "data");
    view.setUint32(40, audioBuffer.length * numOfChannels * 2, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i] * 0x7fff;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: "audio/wav" });
  }

  writeUTFBytes(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }


  // Função para enviar o áudio ao back-end
  uploadAudio(file) {
    if (this.uploading) {
      console.warn("Já existe um upload em andamento, evitando duplicação.");
      return;
    }

    this.uploading = true;

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("project_id");
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("project_id", projectId);

    console.log("Enviando:", [...formData.entries()]);

    const token = localStorage.getItem("token") || getCookie("token");

    fetch("http://localhost:8000/api/upload-audio", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === "sucesso") {
          console.log("Áudio enviado com sucesso:", data);
          this.showToast("Áudio adicionado com sucesso!", 3000, "sucesso");
          window.location.reload();
        } else if (data.status === "insucesso") {
          this.showToast(data.message, 3000, "aviso");
        } else {
          console.error("Erro ao enviar áudio:", data.message);
          this.showToast(data.message, 3000, "erro");
        }
      })
      .catch(error => console.error("Erro na requisição:", error))
      .finally(() => {
        this.uploading = false;
      });
  }

  async mergeAudiosOverload(file1, file2, projectId) {
    try {
      console.log("🎵 Enviando solicitação para mesclar áudios no backend...");

      let token = localStorage.getItem("token") || getCookie("token");
      if (!token) {
        this.showToast("Usuário não autenticado!", 5000, "erro");
        window.location.href = "./../index.html";
        return;
      }

      const loadingToast = this.showToast("Mesclando áudios...", 0, "aviso");

      const response = await fetch("http://localhost:8000/api/editar/mesclar", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          file1: file1,
          file2: file2,
        }),
      });

      const result = await response.json();

      // Remover toast de carregamento
      this.removeToast(loadingToast);

      if (response.ok) {
        console.log("✅ Áudio mesclado com sucesso!", result);

        this.showToast("Áudio mesclado com sucesso!", 3000, "sucesso");
        window.location.reload();
      } else {
        this.showToast("Erro ao mesclar áudio: " + result.message, 5000, "erro");
      }
    } catch (error) {
      console.error("Erro ao mesclar os áudios:", error);
      this.showToast("Erro ao conectar ao servidor.", 5000, "erro");
    }
  }

  showToast(message, duration = 3000, type = "sucesso") {
    const toastContainer = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    if (duration > 0) {

      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }

    return toast;
  }

  // Função para remover um toast manualmente
  removeToast(toast) {
    if (toast) {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 500);
    }
  }

  abrirModalRecorte() {
    console.log("entrou");
    let existingModal = document.getElementById("recortar-modal");
    if (existingModal) {
      return;
    }

    // Criar modal dinamicamente
    let modal = document.createElement("div");
    modal.id = "recortar-modal";
    modal.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          text-align: center;
      `;

    // Criar título do modal
    let title = document.createElement("h3");
    title.textContent = "Selecione o áudio para recortar";
    title.style.color = "black";
    title.style.maxWidth = "100%";
    title.style.overflow = "hidden";
    title.style.whiteSpace = "normal";
    modal.appendChild(title);

    // Criar select
    let select = document.createElement("select");
    select.style.cssText = "width: 100%; padding: 5px; margin-top: 10px;";

    // Adicionar opções com os nomes dos áudios
    this.audioFileNames.forEach((fileName, index) => {
      let option = document.createElement("option");
      option.value = index;
      option.textContent = fileName;
      option.title = arquivo.file_name;
      select.appendChild(option);
    });

    modal.appendChild(select);

    // Criar botão de confirmar
    let btnConfirm = document.createElement("button");
    btnConfirm.textContent = "Recortar";
    btnConfirm.style.cssText = "margin-top: 15px; padding: 5px 10px; cursor: pointer; background: #28a745; color: white; border: none; border-radius: 5px;";

    btnConfirm.addEventListener("click", () => {
      let selectedIndex = Number(select.value);
      this.recortarAudio(selectedIndex);
      document.body.removeChild(modal);
    });

    modal.appendChild(btnConfirm);

    // botão de cancelar
    let btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancelar";
    btnCancel.style.cssText = "margin-left: 10px; padding: 5px 10px; cursor: pointer; background: #dc3545; color: white; border: none; border-radius: 5px;";

    btnCancel.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    modal.appendChild(btnCancel);

    document.body.appendChild(modal);
  }

  async carregarArquivosNoSelector() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("project_id");
    let token = localStorage.getItem("token") || getCookie("token");

    try {
      const response = await fetch(`http://localhost:8000/api/projectos/${projectId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      const select = document.getElementById("audioFileSelector");
      select.innerHTML = "";
      console.log(result.arquivos);
      if (response.ok && result.projecto && result.projecto.arquivos.length) {
        result.projecto.arquivos.forEach((arquivo) => {
          const option = document.createElement("option");
          option.value = arquivo.file_name;
          option.textContent = arquivo.file_name;
          option.title = arquivo.file_name;
          select.appendChild(option);
        });
      } else {
        select.innerHTML = "<option value=''>Nenhum arquivo encontrado</option>";
      }
    } catch (error) {
      console.error("Erro ao carregar arquivos do projeto:", error);
    }
  }

  abrirModalRecorte() {
    console.log("Entrou no modal de recorte");

    if (document.getElementById("recortar-modal")) return;

    const modal = this.criarModal();
    const select = this.criarSelectAudio(this.audioFileNames);
    const timeInputs = this.criarInputsTempo();
    const btnConfirm = this.criarBotaoConfirmar(select, timeInputs.startTimeInput, timeInputs.endTimeInput, modal);
    const btnCancel = this.criarBotaoCancelar(modal);

    modal.appendChild(select);
    modal.appendChild(timeInputs.container);
    modal.appendChild(btnConfirm);
    modal.appendChild(btnCancel);

    document.body.appendChild(modal);
  }

  // Função para criar o modal
  criarModal() {
    let modal = document.createElement("div");
    modal.id = "recortar-modal";
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        text-align: center;
    `;

    let title = document.createElement("h3");
    title.textContent = "Selecione o áudio para recortar";
    title.style.color = "black";
    title.style.maxWidth = "100%";  
    title.style.overflow = "hidden"; 
    title.style.whiteSpace = "normal";  
    modal.appendChild(title);

    return modal;
  }

  // Função para criar o select de áudio
  criarSelectAudio(fileNames) {
    let select = document.createElement("select");
    select.style.cssText = "width: 100%; padding: 5px; margin-top: 10px;";

    fileNames.forEach((fileName) => {
      let option = document.createElement("option");
      option.value = fileName;
      option.textContent = fileName;
      option.title = fileName; 
      select.appendChild(option);
    });

    return select;
  }


  // Função para criar os inputs de tempo
  criarInputsTempo() {
    let container = document.createElement("div");
    container.style.marginTop = "10px";

    let startTimeInput = this.criarInput("start-time", "Início (s):");
    let endTimeInput = this.criarInput("end-time", "Fim (s):");

    container.appendChild(startTimeInput.label);
    container.appendChild(startTimeInput.input);
    container.appendChild(endTimeInput.label);
    container.appendChild(endTimeInput.input);

    return { container, startTimeInput: startTimeInput.input, endTimeInput: endTimeInput.input };
  }

  // Função auxiliar para criar inputs com labels
  criarInput(id, labelText) {
    let label = document.createElement("span");
    label.textContent = labelText;
    label.style.marginRight = "5px";

    let input = document.createElement("input");
    input.type = "number";
    input.id = id;
    input.min = "0";
    input.step = "0.1";
    input.style.cssText = "width: 75px; margin-left: 5px;";

    return { label, input };
  }

  // Função para criar botão de confirmar
  criarBotaoConfirmar(select, startTimeInput, endTimeInput, modal) {
    let btnConfirm = document.createElement("button");
    btnConfirm.textContent = "Recortar";
    btnConfirm.style.cssText = "margin-top: 15px; padding: 5px 10px; cursor: pointer; background: #28a745; color: white; border: none; border-radius: 5px;";

    btnConfirm.addEventListener("click", async () => {
      let selectedFileName = select.value;
      let startTime = parseFloat(startTimeInput.value);
      let endTime = parseFloat(endTimeInput.value);

      if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
        alert("Por favor, insira tempos válidos!");
        return;
      }

      this.enviarRequisicaoRecorte(selectedFileName, startTime, endTime);
      document.body.removeChild(modal);
    });

    return btnConfirm;
  }

  // Função para criar botão de cancelar
  criarBotaoCancelar(modal) {
    let btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancelar";
    btnCancel.style.cssText = "margin-left: 10px; padding: 5px 10px; cursor: pointer; background: #dc3545; color: white; border: none; border-radius: 5px;";

    btnCancel.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    return btnCancel;
  }
  //função para criar modal de merge
  criarMergeModal() {
    // Criar o modal HTML (se ainda não existir)
    if (!document.getElementById("mergeAudioModal")) {
      const modal = document.createElement("div");
      modal.id = "mergeAudioModal";
      modal.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content">
            <h2>Mesclar Áudio</h2>
            
            <label for="audioFileSelector">Escolha o áudio principal:</label>
            <select id="audioFileSelector"></select>
            
            <label for="audioFileM">Escolha o segundo áudio:</label>
            <select id="audioFileSelector2"></select>
            
            <label for="startTimeM">Início (segundos):</label>
            <input type="number" id="startTimeM" min="0" step="0.1" value="0">
            
            <label for="endTimeM">Fim (segundos):</label>
            <input type="number" id="endTimeM" min="0" step="0.1" value="5">
            
            <button id="confirmMerge">Mesclar</button>
            <button id="closeModal">Cancelar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Adicionar funcionalidade de fechar modal
      document.getElementById("closeModal").addEventListener("click", () => {
        modal.style.display = "none";
      });
    }
  }

  // Função para enviar a requisição de recorte
  async enviarRequisicaoRecorte(file_name, inicio, fim) {
    const urlParams = new URLSearchParams(window.location.search);
    const project_id = urlParams.get("project_id");
    let token = localStorage.getItem("token") || getCookie("token");
    try {
      let response = await fetch("http://localhost:8000/api/editar/recortar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id,
          file_name,
          inicio: Math.floor(inicio),
          fim: Math.floor(fim)
        }),
      });

      let result = await response.json();
      this.showToast(result.message || "Áudio recortado com sucesso!", 3000, "sucesso");
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Erro ao enviar requisição:", error);
      this.showToast("Erro ao enviar requisição:" + error, 3000, "erro");
    }
  }
  //abrir modal de retroceder audio
  abrirModalRetroceder(projectId) {
    console.log("Entrou no modal de retroceder " + projectId);

    if (document.getElementById("retroceder-modal")) return;

    const modal = this.criarModalRetroceder();
    const select = this.criarSelectAudio(this.audioFileNames);
    const btnConfirm = this.criarBotaoConfirmarRetroceder(select, projectId, modal);
    const btnCancel = this.criarBotaoCancelarRetroceder(modal);

    modal.appendChild(select);
    modal.appendChild(btnConfirm);
    modal.appendChild(btnCancel);

    document.body.appendChild(modal);
  }

  // Função para criar o modal
  criarModalRetroceder() {
    let modal = document.createElement("div");
    modal.id = "retroceder-modal";
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        text-align: center;
    `;

    let title = document.createElement("h3");
    title.textContent = "Selecione o áudio para restaurar";
    title.style.maxWidth = "100%";  
    title.style.overflow = "hidden";  
    title.style.whiteSpace = "normal"; 
    title.style.color = "black";
    modal.appendChild(title);

    return modal;
  }

  // Função para criar o botão de confirmar
  criarBotaoConfirmarRetroceder(select, projectId, modal) {
    let btnConfirm = document.createElement("button");
    btnConfirm.textContent = "Confirmar";
    btnConfirm.style.cssText = `
        background: #28a745;
        color: white;
        border: none;
        padding: 10px;
        margin-top: 10px;
        cursor: pointer;
        width: 100%;
    `;

    btnConfirm.onclick = () => {
      const selectedFile = select.value;
      if (!selectedFile) {
        this.showToast("Selecione um arquivo!", 5000, "aviso");
        return;
      }

      this.retrocederEdicao(projectId, selectedFile);

      document.body.removeChild(modal);
    };

    return btnConfirm;
  }

  // Função para criar o botão de cancelar
  criarBotaoCancelarRetroceder(modal) {
    let btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancelar";
    btnCancel.style.cssText = `
        background: #dc3545;
        color: white;
        border: none;
        padding: 10px;
        margin-top: 10px;
        cursor: pointer;
        width: 100%;
    `;

    btnCancel.onclick = () => {
      document.body.removeChild(modal);
    };

    return btnCancel;
  }

  abrirModalEfeito(projectId) {
    console.log("Entrou no modal de retroceder " + projectId);

    if (document.getElementById("efeito-modal")) return;

    const modal = this.criarModalEfeito();
    const select = this.criarSelectAudio(this.audioFileNames);
    const btnConfirm = this.criarBotaoConfirmarEfeito(select, projectId, modal);
    const btnCancel = this.criarBotaoCancelarEfeito(modal);

    modal.appendChild(select);
    modal.appendChild(btnConfirm);
    modal.appendChild(btnCancel);

    document.body.appendChild(modal);
  }
  criarModalEfeito() {
    let modal = document.createElement("div");
    modal.id = "efeito-modal";
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        text-align: center;
    `;

    let title = document.createElement("h3");
    title.textContent = "Selecione o áudio para aplicar efeito";
    title.style.maxWidth = "100%";  
    title.style.overflow = "hidden";  
    title.style.whiteSpace = "normal";
    title.style.color = "black";
    modal.appendChild(title);

    return modal;
  }
  criarBotaoConfirmarEfeito(select, projectId, modal) {
    let btnConfirm = document.createElement("button");
    btnConfirm.textContent = "Confirmar";
    btnConfirm.style.cssText = `
        background: #28a745;
        color: white;
        border: none;
        padding: 10px;
        margin-top: 10px;
        cursor: pointer;
        width: 100%;
    `;

    btnConfirm.onclick = () => {
      const selectedFile = select.value;
      if (!selectedFile) {
        this.showToast("Selecione um arquivo!", 5000, "aviso");
        return;
      }

      this.efeitoRequisicao(projectId, selectedFile);

      document.body.removeChild(modal);
    };

    return btnConfirm;
  }

  // Função para criar o botão de cancelar
  criarBotaoCancelarEfeito(modal) {
    let btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancelar";
    btnCancel.style.cssText = `
        background: #dc3545;
        color: white;
        border: none;
        padding: 10px;
        margin-top: 10px;
        cursor: pointer;
        width: 100%;
    `;

    btnCancel.onclick = () => {
      document.body.removeChild(modal);
    };

    return btnCancel;
  }

  // Função para enviar a requisição de efeito reverb
  efeitoRequisicao(projectId, selectedFile) {
    let token = localStorage.getItem("token") || getCookie("token");
    try {
      // Monta o payload da requisição
      const requestBody = {
        project_id: projectId,
        file_name: selectedFile,
        efeito: "reverb"
      };
      console.log(requestBody+" "+ token);
      // Envia a requisição para a API
      fetch("http://localhost:8000/api/editar/aplicar-efeito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })
        .then(response => response.json())
        .then(data => {
          if (data.status === "sucesso") {
            this.showToast("Efeito reverb aplicado com sucesso!", 3000, "sucesso");
            setTimeout(() => window.location.reload(), 2000);
          } else {
            throw new Error(data.message);
          }
        })
        .catch(error => {
          console.error("Erro ao aplicar efeito:", error);
          this.showToast("Erro ao aplicar efeito: " + error.message, 5000, "erro");
        });

    } catch (error) {
      console.error("Erro inesperado:", error);
      this.showToast("Erro inesperado ao aplicar efeito.", 5000, "erro");
    }
  }


  // Método atualizado para restaurar o áudio selecionado
  retrocederEdicao(projectId, fileName) {
    console.log("project_id" + projectId);
    let token = localStorage.getItem("token") || getCookie("token");
    if (!token) {
      this.showToast("Usuário não autenticado", 5000, "aviso");
      setTimeout(() => {
        window.location.href = "./../index.html";
      }, 5000);
      return;
    }

    fetch(`http://localhost:8000/api/undo-audio/${projectId}/${fileName}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status === "sucesso") {
          this.showToast(result.message || "Áudio restaurado com sucesso!", 3000, "sucesso");
          setTimeout(() => { window.location.reload(); }, 3500);
        } else {
          this.showToast(result.message || "Erro ao restaurar", 3000, "erro");
        }
      })
      .catch((error) => {
        console.error("Erro ao restaurar:", error);
        this.showToast("Erro ao conectar ao servidor:" + error, 3000, "erro");
      });
  }

  async appendAudio(selectedFile, startTime, endTime) {
    let token = localStorage.getItem("token") || getCookie("token");
    const startTimeIn = startTime ? parseFloat(startTime) : 0;
    try {
      // Obtém o project_id da URL
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project_id");

      if (!projectId) {
        this.showToast("Erro: ID do projeto não encontrado!", 5000, "erro");
        return;
      }

      // Monta o payload da requisição
      const requestBody = {
        project_id: projectId,
        file_name: selectedFile,
        start_time: startTimeIn,
        end_time: endTime
      };

      console.log(requestBody);

      // Envia a requisição para a API
      const response = await fetch("http://localhost:8000/api/editar/alongar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Erro ao processar requisição: ${response.statusText}`);
      }

      const responseData = await response.json();

      
      this.showToast("Áudio alongado com sucesso", 3000, "sucesso");

      console.log("Resposta da API:", responseData);

      window.location.reload();
    } catch (error) {
      console.error("Erro ao alongar áudio:", error);
      this.showToast("Ocorreu um erro ao processar o áudio. Tente novamente: " + error, 3000, "erro");
    }
  }
  attachListeners() {
    let audioViewer = document.querySelector(".audio-viewer");
    const audioControllers = document.querySelector(".audio-controllers");

    document.addEventListener("mousemove", (event) => {
      if (this.isMoving) {
        let newX = event.clientX - this.offsetX;
        const mixerWidth = this.mixer.getBoundingClientRect().width;
        newX = Math.max(0, Math.min(newX, mixerWidth - this.bar.offsetWidth));
        this.bar.style.left = `${newX}px`;

        const progress = (newX / mixerWidth) * this.audio.duration;
        this.audio.currentTime = progress;
      }
    });

    document.addEventListener("mouseup", () => {
      this.isMoving = false;
    });

    this.btnAddAudio.removeEventListener("click", this.handleFileClick);
    this.handleFileClick = () => faixaFile.click();
    this.btnAddAudio.addEventListener("click", this.handleFileClick);

    this.faixaFile.removeEventListener("change", this.handleFileChange);

    this.handleFileChange = async (event) => {
      event.preventDefault();
      const file = faixaFile.files[0];
      if (file) {
        console.log("Chamando uploadAudio");
        this.uploadAudio(file);
      }
    };

    this.faixaFile.addEventListener("change", this.handleFileChange);

    this.btnRecortar.removeEventListener("click", this.handleRecortarClick);

    this.handleRecortarClick = () => {
      this.abrirModalRecorte();
    };

    this.btnRecortar.addEventListener("click", this.handleRecortarClick);


    this.btnMesclar.addEventListener("click", async () => {
      this.criarMergeModal();
      document.getElementById("mergeAudioModal").style.display = "block";

      // Limpa e preenche a lista de opções de áudio
      const fileSelector = document.getElementById("audioFileSelector");
      // Limpa e preenche a lista de opções de áudio
      const fileSelector2 = document.getElementById("audioFileSelector2");
      //fileSelector.innerHTML = ""; // Remove opções antigas
      console.log(this.audioFileNames);
      // Preenche os áudios carregados no projeto

      for (let i = 0; i < this.audioFileNames.length; i++) {
        const option = document.createElement("option");
        option.value = this.audioFileNames[i];
        option.textContent = this.audioFileNames[i];
        option.title = this.audioFileNames[i];
        fileSelector.appendChild(option);
        const option2 = document.createElement("option");
        option2.value = this.audioFileNames[i];
        option2.textContent = this.audioFileNames[i];
        option2.title = this.audioFileNames[i];
        fileSelector2.appendChild(option2);
      }

      // Removendo event listeners anteriores para evitar múltiplas chamadas
      const confirmMergeBtn = document.getElementById("confirmMerge");
      confirmMergeBtn.replaceWith(confirmMergeBtn.cloneNode(true));

      document.getElementById("confirmMerge").addEventListener("click", async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get("project_id");

        const file1 = fileSelector.value;
        const file2 = fileSelector2.value;

        if (!file1 || !file2) {
          this.showToast("Selecione dois arquivos de áudio.", 5000, "aviso");
          return;
        }

        await this.mergeAudiosOverload(file1, file2, projectId);

        document.getElementById("mergeAudioModal").style.display = "none";
      });
    });

    this.btnMesclar2.addEventListener("click", () => {
      this.btnMesclar.click();
    })

    this.btnRetrocederEdicao.addEventListener("click", () => {
      // Captura o projectId da URL
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project_id");
      if (!projectId) {
        this.showToast("Erro: ID do projeto não encontrado!", 5000, "erro");
        return;
      }

      this.showToast("Abrindo opções para retroceder...", 2000, "aviso");
      this.abrirModalRetroceder(projectId); // Abrir modal para escolher o arquivo antes de retroceder
    });
    this.btnRetrocederEdicao2.addEventListener("click", () => {
      this.btnRetrocederEdicao.click();
    })

    this.btnEfeito.addEventListener("click", () => {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project_id");
      if (!projectId) {
        this.showToast("Erro: ID do projeto não encontrado!", 5000, "erro");
        return;
      }

      this.showToast("Abrindo opções para aplicar efeito...", 2000, "aviso");
      this.abrirModalEfeito(projectId);
    });
    this.btnEfeito2.addEventListener("click",()=>{
      this.btnEfeito.click();
    })

    this.actionSelect.addEventListener("change", () => {
      const selectedAction = this.actionSelect.value;

      // Oculta tudo primeiro
      this.timeFields.classList.add("hidden");
      this.submitButton.classList.add("hidden");
      this.fileSelectorContainer.classList.add("hidden");

      // Exibe os campos necessários para a ação escolhida
      if (selectedAction === "appendAudio") {
        this.fileSelectorContainer.classList.remove("hidden");
        this.timeFields.classList.remove("hidden");
        this.submitButton.classList.remove("hidden");
      } else if (selectedAction === "repeatFragment") {
        this.timeFields.classList.remove("hidden");
        this.submitButton.classList.remove("hidden");
      }
    });

    this.form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const action = this.actionSelect.value;

      // Seleciona diretamente os inputs dentro de timeFields
      const timeFields = document.getElementById("timeFields");
      const startTimeInput = timeFields.querySelector("#startTime");
      const endTimeInput = timeFields.querySelector("#endTime");

      const startTime = startTimeInput ? parseFloat(startTimeInput.value) || null : null;
      const endTime = endTimeInput ? parseFloat(endTimeInput.value) || null : null;

      const selectedFile = this.fileSelector.value;

      if (!action) {
        this.showToast("Por favor, selecione uma ação!", 5000, "aviso");
        return;
      }

      if (action === "appendAudio" && !selectedFile) {
        this.showToast("Por favor, selecione um arquivo de áudio!", 5000, "aviso");
        return;
      }

      // Verifica se os tempos foram preenchidos corretamente
      if ((startTime === null || endTime === null) && action !== "appendAudio") {
        alert("Por favor, insira valores válidos para tempo de início e fim.");
        return;
      }

      // Chamar a função correta
      if (action === "appendAudio") {
        await this.appendAudio(selectedFile, startTime, endTime);
      }

      this.modalA.style.display = "none"; // Fecha o modal após o envio
    });

    this.btnAlongar.addEventListener("click", async () => {
      this.modalA.style.display = "flex";

      // Preencher a lista de arquivos disponíveis no projeto
      const fileSelector = document.getElementById("fileSelectorA");

      for (let i = 0; i < this.audioFileNames.length; i++) {
        const option = document.createElement("option");
        option.value = this.audioFileNames[i];
        option.textContent = this.audioFileNames[i];
        option.title = this.audioFileNames[i];
        fileSelector.appendChild(option);
      }
    });
    this.btnAlongar2.addEventListener("click", () => {
      this.btnAlongar.click();
    })

    // Fechar modal ao clicar fora do conteúdo
    window.addEventListener("click", (event) => {
      if (event.target === this.modalA) {
        this.modalA.style.display = "none";
      }
    });

    document.getElementById("btn-cancelar").addEventListener("click", () => {
      this.modalA.style.display = "none";
    });

    audioViewer.addEventListener("mouseover", () => {
      audioViewer.style.overflowY = "auto"; // Mostra o scroll local
      document.body.style.overflowY = "hidden"; // Desativa o scroll global
    });

    // Quando o mouse sair do audio-viewer
    audioViewer.addEventListener("mouseout", () => {
      audioViewer.style.overflowY = "hidden"; // Oculta o scroll local
      document.body.style.overflowY = "auto"; // Reativa o scroll global
    });

    audioViewer.addEventListener("scroll", () => {
      // Ajusta a rolagem de audio-controllers para ser igual à de audio-viewer
      audioControllers.style.overflowY = "hidden";
      audioControllers.scrollTop = audioViewer.scrollTop;
    });

    this.btnAddAudio.addEventListener("click", () => this.faixaFile.click());
    this.faixaFile.addEventListener("change", this.handleFileChange);
    //elementos dinâmicos
    this.form.reset();
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.audioBuffers = [];
    this.audioFileNames = [];
    this.btnPlay.addEventListener("click", (e) => {
      this.btnPause.style.backgroundColor = "black";
      this.btnPlay.style.backgroundColor = "lightgreen";
      this.btnStop.style.backgroundColor = "black";
      this.reproduzirTodos();
    });
    this.btnPause.addEventListener("click", (e) => {
      this.btnPause.style.backgroundColor = "lightgreen";
      this.btnPlay.style.backgroundColor = "black";
      this.btnStop.style.backgroundColor = "black";
      this.pausarTodos();
    });
    this.btnStop.addEventListener("click", (e) => {
      this.btnStop.style.backgroundColor = "lightgreen";
      this.btnPlay.style.backgroundColor = "black";
      this.btnPause.style.backgroundColor = "black";
      this.zerarTodos();
    });
    this.btnRestart.addEventListener("click",()=>{
      this.btnRestart.style.backgroundColor = "lightgreen";
      setTimeout(()=>{
        this.btnRestart.style.backgroundColor = "black";
      },500);
      this.reiniciarTodos();
    })
    this.btnPrev.addEventListener("click", () => {
      this.changeButtonColor(this.btnPrev);
      this.seekAudio(-10); 
    });

    this.btnPos.addEventListener("click", () => {
      this.changeButtonColor(this.btnPos);
      this.seekAudio(10); 
    });
  }
}
