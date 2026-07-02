import React, { useState, useEffect, useMemo } from 'react';
import './NavBar.css';

const Navbar = ({ visible }) => {  // <-- accept visible prop
    const navLinks = useMemo(() => [
        { href: '#about', label: 'About' },
        { href: '#experience', label: 'Experience' },
        { href: '#projects', label: 'Projects' },
        { href: '#contact', label: 'Contact' },
    ], []);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [staggerClasses, setStaggerClasses] = useState([]);
    const [isMounted, setIsMounted] = useState(false);
    const [activeSection, setActiveSection] = useState('');

    // Handle resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle menu mount animation
    useEffect(() => {
        if (isMenuOpen) {
            setIsMounted(true);
        } else {
            const timeout = setTimeout(() => setIsMounted(false), 400);
            return () => clearTimeout(timeout);
        }
    }, [isMenuOpen]);

    // Stagger menu link animations
    useEffect(() => {
        if (isMenuOpen) {
            const delays = [100, 200, 300, 400];
            delays.forEach((delay, index) => {
                setTimeout(() => {
                    setStaggerClasses(prev => [...prev, `stagger-${index + 1}`]);
                }, delay);
            });
        } else {
            setStaggerClasses([]);
        }
    }, [isMenuOpen]);

    // Active section detection on scroll
    useEffect(() => {
        const handleScroll = () => {
            const sections = navLinks
                .map(link => document.querySelector(link.href))
                .filter(Boolean);

            let currentActive = '';
            let minDiff = Infinity;
            const threshold = window.innerHeight * 0.4;

            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                const topDistance = Math.abs(rect.top - threshold);

                if (rect.top <= threshold && topDistance < minDiff) {
                    minDiff = topDistance;
                    currentActive = navLinks[index].href;
                }

                // Handle bottom section (#contact)
                if (
                    index === sections.length - 1 &&
                    rect.top < window.innerHeight &&
                    rect.bottom >= 0
                ) {
                    currentActive = navLinks[index].href;
                }
            });

            if (currentActive !== activeSection) {
                setActiveSection(currentActive);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [navLinks, activeSection]);

    const toggleMenu = () => setIsMenuOpen(prev => !prev);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <header className={`nav-bar ${isMenuOpen ? 'open' : ''} ${visible ? 'visible' : 'hidden'}`}>
            {isMobile ? (
                <>
                    {!isMounted ? (
                        <div className="navbar-collapsed">
                            <a className="brand" href="https://cannotknee.github.io">Kenny Ong</a>
                            <div className="hamburger" onClick={toggleMenu}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    ) : (
                        <div className="navbar-expanded">
                            <div className={`nav-links mobile ${isMenuOpen ? 'open' : ''}`}>
                                {navLinks.map((link, index) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className={`nav-item link ${staggerClasses[index] || ''} ${activeSection === link.href ? 'active' : ''}`}
                                        onClick={closeMenu}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                            <div className="close-button" onClick={toggleMenu}>✕</div>
                        </div>
                    )}
                </>
            ) : (
                <div className="navbar-desktop">
                    <a className="brand" href="https://cannotknee.github.io">Kenny Ong</a>
                    <div className="nav-links desktop">
                        {navLinks.map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                className={`nav-item link ${activeSection === link.href ? 'active' : ''}`}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
