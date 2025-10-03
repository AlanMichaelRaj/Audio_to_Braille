import { useState } from "react";

function AudioUploader() {
    const [transcript, setTranscript] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", "whisper-1");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`, // stored in .env
            },
            body: formData,
        });

        const data = await response.json();
        setTranscript(data.text);
        setLoading(false);
    };

    return (
        <div>
            <input type="file" accept="audio/*" onChange={handleUpload} />
            {loading ? <p>🎙️ Transcribing...</p> : <p>{transcript}</p>}
        </div>
    );
}

export default AudioUploader;
