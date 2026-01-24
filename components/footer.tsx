import { Youtube, Linkedin, Mail, Link } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-neutral-950 text-neutral-400 py-12 px-6 border-t border-neutral-800">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-4">
                    <h3 className="text-2xl font-serif text-primary">Suvarna Gaura Hari Das</h3>
                    <p className="text-sm">Monk, Educator, Mentor, Life Coach</p>
                    <div className="text-xs space-y-1">
                        <p>ISKCON South Bengaluru</p>
                        <p>3rd Main, Samvrudhi Enclave, Kumaraswamy Layout</p>
                        <p>Bengaluru, Karnataka 560111</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold text-white">Connect</h4>
                    <div className="flex flex-col space-y-2 text-sm">
                        <a href="https://linktr.ee/sghdas" target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors gap-2"><Link className="w-4 h-4" /> LinkTree</a>
                        <a href="https://www.linkedin.com/in/shivkumar-salegar-0241aa24/" target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors gap-2"><Linkedin className="w-4 h-4" /> LinkedIn</a>
                        <a href="mailto:shiv.salegar@gmail.com" className="flex items-center hover:text-primary transition-colors gap-2"><Mail className="w-4 h-4" /> Email</a>
                        <a href="https://iyfsouthbangalore.in/" target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors gap-2">Website (IYF)</a>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold text-white">YouTube Channels</h4>
                    <div className="flex flex-col space-y-2 text-sm">
                        <a href="https://www.youtube.com/@SuvarnaGauraharidas" target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors gap-2"><Youtube className="w-4 h-4" /> Suvarna Gaurahari das</a>
                        <a href="https://www.youtube.com/channel/UCDu4uwzTU3A-mJTHFjtSLtA" target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors gap-2"><Youtube className="w-4 h-4" /> IYF South Bengaluru</a>
                        <a href="https://www.youtube.com/channel/UCiXhP2FXgk5tQw92CEZa86Q" target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors gap-2"><Youtube className="w-4 h-4" /> ISKCON Kannada</a>
                    </div>
                </div>

                <div>
                    {/* Admin Link for easy access */}
                    <a href="/admin" className="text-xs opacity-30 hover:opacity-100 transition-opacity">Admin Login</a>
                </div>
            </div>
            <div className="text-center text-xs mt-12 opacity-50">
                © {new Date().getFullYear()} Suvarna Gaura Hari Das. All rights reserved.
            </div>
        </footer>
    );
}
