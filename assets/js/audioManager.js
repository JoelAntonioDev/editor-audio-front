class AudioManager {
    constructor(audioElement, bar, mixer, audioUI) {
        this.audio = audioElement;
        this.bar = bar;
        this.mixer = mixer;
        this.isMoving = false;
        this.offsetX = 0;
        this.audioUI = audioUI;
        this.btnAddAudio = document.getElementById('btn-c1');
        this.faixaFile = document.getElementById('faixaFile');
        //this.aumentarVelocidade = document.getElementById('aumentar-velocidade');
        //this.diminuirVelocidade = document.getElementById('diminuir-velocidade');
        //elementos dinâmicos

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioBuffers = [];
    }

    play() {
        this.audio.play();
    }

    pause() {
        this.audio.pause();
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.updateProgress();
    }

    repeat() {
        this.stop();
        this.play();
    }

    skip(seconds) {
        this.audio.currentTime += seconds;
    }

    setVolume(value) {
        this.audio.volume = value;
    }

    updateProgress() {
        const mixerWidth = this.mixer.clientWidth;
        const progress = this.audio.currentTime / this.audio.duration;
        const newPosition = progress * mixerWidth;
        this.bar.style.left = `${newPosition}px`;
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
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

                this.audioBuffers.push(audioBuffer);

                const wavBlob = this.bufferToWaveBlob(audioBuffer);
                const audioURL = URL.createObjectURL(wavBlob);

                console.log('Áudio carregado!');

                this.audioUI.createSoundTimeController(audioURL, file.name, audioBuffer);
                this.audioUI.hideLoadingModal();
            };

            fileReader.onerror = (error) => {
                console.error('Erro ao carregar o arquivo:', error);
                this.audioUI.hideLoadingModal();
            };
        } catch (error) {
            console.error('Erro ao processar o arquivo:', error);
            this.audioUI.hideLoadingModal();
        }
    }

    bufferToWaveBlob(audioBuffer) {
        const numOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numOfChannels * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);

        // RIFF chunk descriptor
        this.writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 36 + audioBuffer.length * numOfChannels * 2, true);
        this.writeUTFBytes(view, 8, 'WAVE');

        // FMT sub-chunk
        this.writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numOfChannels, true);
        view.setUint32(24, audioBuffer.sampleRate, true);
        view.setUint32(28, audioBuffer.sampleRate * numOfChannels * 2, true);
        view.setUint16(32, numOfChannels * 2, true);
        view.setUint16(34, 16, true);

        // Data sub-chunk
        this.writeUTFBytes(view, 36, 'data');
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

        return new Blob([view], { type: 'audio/wav' });
    }

    writeUTFBytes(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    changeAudioSpeed(buffer, rate) {
        const newLength = Math.floor(buffer.length / rate);
        const newBuffer = this.audioContext.createBuffer(
            buffer.numberOfChannels,
            newLength,
            buffer.sampleRate
        );
    
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const oldData = buffer.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);
    
            for (let i = 0; i < newLength; i++) {
                newData[i] = oldData[Math.floor(i * rate)];
            }
        }
    
        return newBuffer;
    }

    attachListeners() {
        let btnAddAudio = document.getElementById('btn-add-audio');
        let audioViewer = document.querySelector('.audio-viewer');
        const audioControllers = document.querySelector('.audio-controllers');

        this.audio.addEventListener('timeupdate', () => this.updateProgress());

        /*this.bar.addEventListener('mousedown', (event) => {
            event.preventDefault();
            if (this.audio.src) {
                this.isMoving = true;
                this.offsetX = event.clientX;
            }
        });*/

        document.addEventListener('mousemove', (event) => {
            if (this.isMoving) {
                let newX = event.clientX - this.offsetX;
                const mixerWidth = this.mixer.getBoundingClientRect().width;
                newX = Math.max(0, Math.min(newX, mixerWidth - this.bar.offsetWidth));
                this.bar.style.left = `${newX}px`;

                const progress = (newX / mixerWidth) * this.audio.duration;
                this.audio.currentTime = progress;
            }
        });

        document.addEventListener('mouseup', () => {
            this.isMoving = false;
        });

        this.btnAddAudio.addEventListener('click', () => {
            faixaFile.click();
        });

        this.faixaFile.addEventListener('change', async () => {
            const file = faixaFile.files[0];
            if (file) {
                await this.loadAudio(file);
                console.log('Áudio pronto para manipulação.');
            }
        });

        /*this.aumentarVelocidade.addEventListener('click', async () => {

            const allAudioElements = Array.from(document.querySelectorAll('audio')).filter(audio => audio.id !== 'audio');
            const playbackRateIncrease = 0.1;
            console.log(allAudioElements);
            allAudioElements.forEach((audioElement, index) => {
                
                const newPlaybackRate = parseFloat(audioElement.playbackRate) + playbackRateIncrease;
                audioElement.playbackRate = newPlaybackRate;
                console.log(`Áudio ${index} - Velocidade atual:`, newPlaybackRate);


                const adjustedBuffer = this.changeAudioSpeed(this.audioBuffers[index], newPlaybackRate);
                const wavBlob = this.bufferToWaveBlob(adjustedBuffer);

                this.audioBuffers[index] = adjustedBuffer;

                if (audioElement.dataset.audioEditadoURL) {
                    URL.revokeObjectURL(audioElement.dataset.audioEditadoURL);
                }
                const audioEditadoURL = URL.createObjectURL(wavBlob);


                const downloadButton = document.getElementById(`btn-download-edited-${index}`);
                if (downloadButton) {
                    downloadButton.dataset.href = audioEditadoURL;
                    downloadButton.dataset.filename = `audio_${newPlaybackRate.toFixed(1)}x.wav`;
                    console.log(`Áudio ${index} - Botão atualizado com o novo áudio editado.`);
                }

                audioElement.dataset.audioEditadoURL = audioEditadoURL;
            });
        });*/

        /*this.diminuirVelocidade.addEventListener('click', async () => {
            const allAudioElements = Array.from(document.querySelectorAll('audio')).filter(audio => audio.id === 'audio');
            const playbackRateDecrement = 0.1;
        
            allAudioElements.forEach((audioElement, index) => {
        
                const newPlaybackRate = parseFloat(audioElement.playbackRate) - playbackRateDecrement;
                audioElement.playbackRate = newPlaybackRate;
                console.log(`Áudio ${index} - Velocidade atual:`, newPlaybackRate);
        
        
                const adjustedBuffer = changeAudioSpeed(this.audioBuffers[index], newPlaybackRate);
                const wavBlob = this.bufferToWaveBlob(adjustedBuffer);
        
        
                if (audioElement.dataset.audioEditadoURL) {
                    URL.revokeObjectURL(audioElement.dataset.audioEditadoURL); 
                }
                const audioEditadoURL = URL.createObjectURL(wavBlob);
        
        
                const downloadButton = document.getElementById(`btn-download-edited-${index}`);
                if (downloadButton) {
                    downloadButton.dataset.href = audioEditadoURL;
                    downloadButton.dataset.filename = `audio_${newPlaybackRate.toFixed(1)}x.wav`; 
                    console.log(`Áudio ${index} - Botão atualizado com o novo áudio editado.`);
                }
        
                audioElement.dataset.audioEditadoURL = audioEditadoURL;
            });
        });*/
    
        audioViewer.addEventListener('mouseover', () => {
            audioViewer.style.overflowY = 'auto'; // Mostra o scroll local
            document.body.style.overflowY = 'hidden'; // Desativa o scroll global
        });
        
        // Quando o mouse sair do audio-viewer
        audioViewer.addEventListener('mouseout', () => {
            audioViewer.style.overflowY = 'hidden'; // Oculta o scroll local
            document.body.style.overflowY = 'auto'; // Reativa o scroll global
        });
    
        audioViewer.addEventListener('scroll', () => {
            // Ajusta a rolagem de audio-controllers para ser igual à de audio-viewer
            audioControllers.style.overflowY = 'hidden';
            audioControllers.scrollTop = audioViewer.scrollTop;
        });

    }
}
