import { navLinks } from "../../constants/index.js";

const Navbar = () => {
    return (
        <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
            <div className="flex justify-between items-center max-w-6xl mx-auto px-6 py-3">

                {/* Logo / Brand */}
                <a href="#home" className="flex items-center gap-2 text-xl font-bold text-blue-600">
                    AudiotoBraille
                </a>

                {/* Navigation Links */}
                <ul className="flex gap-6">
                    {navLinks.map((link) => (
                        <li key={link.id}>
                            <a
                                href={`#${link.id}`}
                                className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
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
