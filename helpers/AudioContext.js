import getWavFromChannels from '../utils/get-wav-from-channels';
const createAudioContext = require('ios-safe-audio-context');

class AudioContext {

    // SETUP ---------------------------------------------------------------

    constructor(options) {
      super();

      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      this.isRecorded = false;
      this.isRecording = false;
      this.stream = null;

      this.frequencyStorage = [];

      this.url = options.url || '';

      this.setup();
    }

    setup() {
      this.audioContext = createAudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

      // this.loadSoundFromPath( this.url );
    }

    // RECORDING ---------------------------------------------------------------

    startRecording() {
      const constraints = { 'audio': true };

      navigator.getUserMedia(
          constraints,
          this.onStream.bind(this),
          this.onStreamError.bind(this)
      );
    }

    stopRecording() {
      if (this.stream) this.stream.getTracks()[0].stop();
    }

    onStream(stream) {
      this.isRecording = true;
      this.stream = stream;

      this.saveStream( stream );
      // this.connectStream( stream );
    }

    onStreamError(e) {
        console.error('Error getting microphone', e);
    }

    connectStream( stream ) {
      const gain = this.audioContext.createGain();
      const input = this.audioContext.createMediaStreamSource(stream);

      input.connect(gain);

      // Connect recorder
      gain.connect(recorder);
      recorder.connect(this.audioContext.destination);
    }

    saveStream( stream ) {
      const bufferSize = 2048;
      const leftChannel = [];
      const rightChannel = [];
      const sampleRate = this.audioContext.sampleRate;
      const gain = this.audioContext.createGain();
      let recordingLength = 0;

      const input = this.audioContext.createMediaStreamSource(stream);
      input.connect(gain);

      const recorder = this.audioContext.createScriptProcessor( bufferSize, 2, 2 );

      recorder.onaudioprocess = (e) => {

          if (!stream.active) {
              gain.disconnect(recorder);
              recorder.disconnect(this.audioContext.destination);

              const sound = getWavFromChannels( leftChannel, rightChannel, recordingLength, sampleRate );

              this.audioContext.decodeAudioData( sound.buffer, ( buffer ) => {

                  this.buffer = buffer;

                  this._playSound( this.buffer );
                  this.isRecorded = true;
                  this.isRecording = false;
              });

              return;
          }

          const left = e.inputBuffer.getChannelData(0);
          const right = e.inputBuffer.getChannelData(1);
          // we clone the samples
          leftChannel.push (new Float32Array (left));
          rightChannel.push (new Float32Array (right));

          recordingLength += bufferSize;
      };

      // Connect recorder
      gain.connect(recorder);
      recorder.connect(this.audioContext.destination);
    }

    // LOADERS ---------------------------------------------------------------

    loadSoundFromPath(url) {
        const request = new XMLHttpRequest();

        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // Decode asynchronously
        request.onload = () => {
            this.audioContext.decodeAudioData(request.response, (buffer) => {

                this.buffer = buffer;

                this._playSound( this.buffer );
            }, () => {
                console.log('error : ' + request.responseType);
            });
        };

        request.send();
    }

    // STATE ---------------------------------------------------------------

    storeFrequencies() {

        if (!this.isRecording) return;

        const time = this._ctx.currentTime - this._startTime;
        const frequencies = this.getFrequencyArray().slice(0);

        this.frequencyStorage.push({
            time: time,
            frequencies: frequencies,
        });

        return this.frequencyStorage;
    }

    // GETTERS ---------------------------------------------------------------

    getCurrentContextTime() {

        return this.audioContext.currentTime;
    }

    getSoundDuration() {

        if (this.buffer) {

            return this.buffer.duration * 1000; // milliseconds
        } else {

            return null;
        }
    }

    getSoundCurrentTime() {

        if (this.playTime) {

            return Date.now() - this.playTime;
        } else {

            return null;
        }
    }

    getSoundNormalizedCurrentTime() {

        if (this.playTime) {

            return ( Date.now() - this.playTime ) / this.getSoundDuration();
        } else {

            return null;
        }
    }

    getFrequencyArray() {

        this.analyser.getByteFrequencyData(this.frequencyData);

        return this.frequencyData;
    }

    getFrequencyAverage() {

        const audioData = this.getFrequencyArray();
        let average = 0;

        for (let i = 0; i < audioData.length; i++) {
            average += audioData[i];
        }

        average = average / audioData.length;

        return average;
    }

    getFrequencyAtTime( time ) {

        const frequency = this.frequencyStorage[0];

        for (let i = 0; i < this.frequencyStorage.length; i++) {
            if ( Math.abs( time - this.frequencyStorage[i].time ) < Math.abs( time - frequency.time) ) {
                frequency = this.frequencyStorage[i];
            }
        }

        return frequency;
    }

    // PLAYER ---------------------------------------------------------------

    playSound: function(buffer) {

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        gainNode.gain.value = 1;

        source.buffer = buffer;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.connect(this.analyser);

        this.playTime = Date.now();

        source.start(0);
    }
}

export default new audioContext();
