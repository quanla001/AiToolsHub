import { Link } from "react-router-dom";

const Footer = () => {
  const footerLinks = {
    tools: [
      { name: "Text Assistance", path: "/text-assistance" },
      { name: "Generate Image", path: "/text-to-image" },
      { name: "Text to Music", path: "/text-to-music" },
      { name: "Image to Text", path: "/image-to-text" },
      { name: "Text to Speech", path: "/text-to-speech" },
    ],
    company: [
      {
        name: "About",
        path: "https://en.wikipedia.org/wiki/Artificial_intelligence",
      },
      {
        name: "Privacy Policy",
        path: "https://openai.com/policies/row-privacy-policy/",
      },
      { name: "Terms of Service", path: "https://www.google.com" },
    ],
    social: [
      { name: "Youtube", path: "https://youtube.com" },
      { name: "GitHub", path: "https://github.com" },
      { name: "LinkedIn", path: "https://linkedin.com" },
    ],
  };

  return (
    <footer className="bg-gradient-to-b from-transparent to-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
          {/* Tools Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-500">
              Our Tools
            </h3>
            <ul className="space-y-2">
              {footerLinks.tools.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-500">
              Company
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-500">
              Connect
            </h3>
            <ul className="space-y-2">
              {footerLinks.social.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} AI Tool Hub. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-400 text-sm">
                Made with ❤️ by AI Tool Hub Team
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
