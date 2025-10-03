import React, { useEffect, useRef, useState } from "react";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";
import "./Hands.css";

const HandWithTranscription = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);

    const [gesture, setGesture] = useState("");
    const [transcript, setTranscript] = useState("");
    const [recording, setRecording] = useState(false);
    const [error, setError] = useState("");

    const fingers = {
        thumb: [0, 1, 2, 3, 4],
        index: [0, 5, 6, 7, 8],
        middle: [0, 9, 10, 11, 12],
        ring: [0, 13, 14, 15, 16],
        pinky: [0, 17, 18, 19, 20],
    };

    const fingerColors = {
        thumb: "red",
        index: "green",
        middle: "blue",
        ring: "orange",
        pinky: "purple",
    };

    // 🔹 Load Handpose + video
    useEffect(() => {
        let model;

        const runHandpose = async () => {
            try {
                model = await handpose.load();
                console.log("✅ Handpose model loaded");

                if (navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    videoRef.current.srcObject = stream;
                }
                detectHands();
            } catch (err) {
                console.error("Handpose error:", err);
                setError("⚠️ Could not load handpose or camera.");
            }
        };

        const detectHands = async () => {
            if (!videoRef.current || videoRef.current.readyState !== 4) {
                requestAnimationFrame(detectHands);
                return;
            }

            try {
                const predictions = await model.estimateHands(videoRef.current);

                const ctx = canvasRef.current.getContext("2d");
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;

                if (predictions.length > 0) {
                    const prediction = predictions[0];
                    const landmarks = prediction.landmarks;

                    // Draw skeleton
                    Object.keys(fingers).forEach((finger) => {
                        const points = fingers[finger].map((i) => landmarks[i]);
                        ctx.strokeStyle = fingerColors[finger];
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(points[0][0], points[0][1]);
                        for (let i = 1; i < points.length; i++) {
                            ctx.lineTo(points[i][0], points[i][1]);
                        }
                        ctx.stroke();
                    });

                    // Draw joints
                    landmarks.forEach(([x, y]) => {
                        ctx.beginPath();
                        ctx.arc(x, y, 5, 0, 2 * Math.PI);
                        ctx.fillStyle = "white";
                        ctx.fill();
                        ctx.strokeStyle = "black";
                        ctx.stroke();
                    });

                    // Palm center
                    const palmX = (landmarks[0][0] + landmarks[9][0]) / 2;
                    const palmY = (landmarks[0][1] + landmarks[9][1]) / 2;

                    const tipIndices = [8, 12, 16, 20];
                    let totalDist = 0;
                    tipIndices.forEach((i) => {
                        const dx = landmarks[i][0] - palmX;
                        const dy = landmarks[i][1] - palmY;
                        totalDist += Math.sqrt(dx * dx + dy * dy);
                    });
                    const avgDist = totalDist / tipIndices.length;

                    if (avgDist < 60) setGesture("closed_fist");
                    else if (avgDist > 80) setGesture("open_fist");
                    else setGesture("in_between");
                } else {
                    setGesture("no_hand");
                }
            } catch (err) {
                console.error("Hand detection error:", err);
                setError("⚠️ Error detecting hand.");
            }

            requestAnimationFrame(detectHands);
        };

        runHandpose();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // 🔹 Trigger recording based on gesture
    useEffect(() => {
        if (gesture === "closed_fist" || gesture === "in_between") {
            if (!recording) startRecording();
        } else if (gesture === "open_fist") {
            if (recording) stopRecording();
        }
    }, [gesture]);

    // 🎙️ Start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
                await sendToWhisper(audioBlob);
            };

            mediaRecorderRef.current.start();
            setRecording(true);
            setError("");
            console.log("🎙️ Recording started");
        } catch (err) {
            console.error("Recording error:", err);
            setError("⚠️ Microphone access denied or not available.");
        }
    };

    // 🛑 Stop recording
    const stopRecording = () => {
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
                setRecording(false);
                console.log("🛑 Recording stopped");
            }
        } catch (err) {
            console.error("Stop recording error:", err);
            setError("⚠️ Could not stop recording.");
        }
    };

    // 📝 Send audio to Whisper
    const sendToWhisper = async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");
            formData.append("model", "whisper-1");

            const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error: ${response.status} ${errText}`);
            }

            const data = await response.json();
            setTranscript(data.text || "❌ No transcription returned.");
            setError("");
        } catch (err) {
            console.error("Transcription error:", err);
            setError("⚠️ Failed to transcribe audio. Check API key or internet connection.");
        }
    };

    return (
        <div>
            <div className="hand-container">
                <video ref={videoRef} autoPlay playsInline></video>
                <canvas ref={canvasRef}></canvas>
            </div>

            <div className="gesture-output">
                {gesture === "open_fist" && <p>🛑 Audio recording ended</p>}
                {gesture === "closed_fist" && <p>🎙️ Recording... Speak now</p>}
                {gesture === "in_between" && <p>🎙️ Recording... Speak now</p>}
                {gesture === "no_hand" && <p>No gesture detected</p>}
            </div>

            {transcript && (
                <div className="transcript-output">
                    <h3>📝 Transcription:</h3>
                    <p>{transcript}</p>
                </div>
            )}

            {error && (
                <div className="error-message" style={{ color: "red", marginTop: "10px" }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default HandWithTranscription;
