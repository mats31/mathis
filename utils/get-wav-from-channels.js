export default function getWavFromChannels( leftChannel, rightChannel, soundLength, sampleRate ) {

    function mergeBuffers( channelBuffer, soundLength ) {

        const result = new Float32Array(soundLength);
        const lng = channelBuffer.length;
        let offset = 0;

        for (let i = 0; i < lng; i++) {
            const buffer = channelBuffer[i];

            result.set(buffer, offset);
            offset += buffer.length;
        }

        return result;
    }

    function interleave( leftChannel, rightChannel ) {

        const length = leftChannel.length + rightChannel.length;
        const result = new Float32Array(length);

        let inputIndex = 0;

        for (let index = 0; index < length; ){
            result[index++] = leftChannel[inputIndex];
            result[index++] = rightChannel[inputIndex];
            inputIndex++;
        }

        return result;
    }

    function writeUTFBytes( view, offset, string ) {

        const lng = string.length;

        for (let i = 0; i < lng; i++){
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    leftChannel = mergeBuffers( leftChannel, soundLength );
    rightChannel = mergeBuffers( rightChannel, soundLength );

    const channels = interleave( leftChannel, rightChannel );

    const buffer = new ArrayBuffer( 44 + channels.length * 2 );
    const view = new DataView( buffer );

    // write the WAV container, check spec at: https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
    // RIFF chunk descriptor
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 44 + channels.length * 2, true);
    writeUTFBytes(view, 8, 'WAVE');
    // FMT sub-chunk
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    // stereo (2 channels)
    view.setUint16(22, 2, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    // data sub-chunk
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, channels.length * 2, true);

    // write the PCM samples
    const lng = channels.length;
    const volume = 1;
    let index = 44;

    for (let i = 0; i < lng; i++){
        view.setInt16(index, channels[i] * (0x7FFF * volume), true);
        index += 2;
    }

    // our final binary blob that we can hand off
    const blob = new Blob ( [ view ], { type : 'audio/wav' } );

    return {
        blob: blob,
        buffer: buffer
    };
});
