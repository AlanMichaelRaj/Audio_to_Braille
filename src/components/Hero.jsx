import React, { useEffect, useState } from "react";
import DecryptedText from "./DecryptedText"; // your text animation component
import HandsWithTranscription from "../HandGestures/HandsWithTranscription"; // new hand + audio component
import "./Hero.css"; // background + styling

const Hero = () => {
    const [lines, setLines] = useState([]);

    useEffect(() => {
        // Load text from public/DecryptedText.txt
        fetch("/DecryptedText.txt")
            .then((res) => res.text())
            .then((text) => {
                setLines(text.split("\n").filter((line) => line.trim() !== "")); // remove empty lines
            })
            .catch((err) => console.error("Error loading text file:", err));
    }, []);

    return (
        <section id="hero" className="texture">
            <div className="hero-content">
                {/* Text Animation */}
                {lines.map((line, index) => (
                    <DecryptedText
                        key={index}
                        text={line}
                        className="text-4xl md:text-5xl font-bold text-white"
                        encryptedClassName="encrypted"
                        parentClassName="mb-4"
                        speed={100}
                        maxIterations={50}
                        animateOn="view"
                    />
                ))}

                {/* Single Hand + Audio Transcription Component */}
                <div style={{ marginTop: "2rem" }}>
                    <HandsWithTranscription />
                </div>
            </div>
        </section>
    );
};

export default Hero;
