import { navLinks } from "../../constants/index.js";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
    useGSAP(() => {
        const navTween = gsap.timeline({
            scrollTrigger: {
                trigger: "nav",
                start: "bottom top",
            },
        });

        navTween.fromTo(
            "nav",
            { backgroundColor: "transparent" },
            {
                backgroundColor: "#00000050",
                backdropFilter: "blur(10px)",
                duration: 1,
                ease: "power1.inOut",

            }
        );
    });

    return (
        <nav className="w-full fixed top-0 left-0 z-50 text-white">
            <div className="flex justify-between items-center max-w-6xl mx-auto px-6 py-3">
                {/* Logo / Brand */}
                <a href="#home" className="flex items-center gap-2 text-xl font-bold text-blue-200">
                    <img src="/images/braille.png" alt="logo" width="45" height="45" />
                    AudiotoBraille
                </a>

                {/* Navigation Links */}
                <ul className="flex gap-6">
                    {navLinks.map((link) => (
                        <li key={link.id}>
                            <a
                                href={`#${link.id}`}
                                className="hover:text-blue-400 transition-colors duration-200"
                            >
                                {link.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
