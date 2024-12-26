class FileHandler {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    async loadAudio(file) {
        try {
            showLoadingModal(file);
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            audioBuffers.push(audioBuffer);


            const wavBlob = bufferToWaveBlob(audioBuffer);
            const audioURL = URL.createObjectURL(wavBlob);

            console.log('Áudio carregado!');


            createSoundTimeController(audioURL, file.name, audioBuffer);
            console.log(audioBuffers);
            hideLoadingModal();

        } catch (error) {
            console.error('Erro ao carregar o áudio:', error);
        }
    }

    bufferToWaveBlob(audioBuffer) {
        const length = audioBuffer.length * audioBuffer.numberOfChannels;
        const interleaved = new Float32Array(length);
        let inputIndex = 0;

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                interleaved[inputIndex++] = channelData[i];
            }
        }

        const buffer = new ArrayBuffer(44 + interleaved.length * 2);
        const view = new DataView(buffer);
        this._writeWaveHeader(view, audioBuffer.sampleRate, audioBuffer.numberOfChannels, interleaved.length);
        this._writeInterleavedData(view, interleaved);

        return new Blob([view], { type: 'audio/wav' });
    }

    _writeWaveHeader(view, sampleRate, numChannels, dataLength) {
        const byteRate = sampleRate * numChannels * 2;
        view.setUint32(0, 0x52494646, false); // RIFF
        view.setUint32(4, 36 + dataLength * 2, true); // File size
        view.setUint32(8, 0x57415645, false); // WAVE
        view.setUint32(12, 0x666d7420, false); // fmt
        view.setUint32(16, 16, true); // Subchunk1Size
        view.setUint16(20, 1, true); // Audio format
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, numChannels * 2, true); // Block align
        view.setUint16(34, 16, true); // Bits per sample
        view.setUint32(36, 0x64617461, false); // data
        view.setUint32(40, dataLength * 2, true); // Subchunk2Size
    }

    _writeInterleavedData(view, interleaved) {
        let offset = 44;
        for (let i = 0; i < interleaved.length; i++, offset += 2) {
            let sample = Math.max(-1, Math.min(1, interleaved[i]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, sample, true);
        }
    }
}
