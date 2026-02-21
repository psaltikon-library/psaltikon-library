import { motion } from 'framer-motion';
import { Page } from '../types';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

const Footer = ({ onNavigate }: FooterProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.footer 
      className="footer"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      <div className="footer-grid">
        <motion.div className="footer-brand" variants={itemVariants}>
          <div className="footer-logo">
            <motion.span 
              style={{ fontSize: '1.5rem', color: 'var(--burgundy)' }}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              ☦
            </motion.span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600 }}>
              Psaltikon Library
            </span>
          </div>
          <p className="footer-description">
            A sacred treasury of Byzantine chant, preserving and sharing the rich 
            tradition of Orthodox liturgical music for the glory of God and the 
            edification of the faithful.
          </p>
        </motion.div>

        <motion.div className="footer-column" variants={itemVariants}>
          <h4>Library</h4>
          <ul className="footer-links">
            <li>
              <motion.a 
                onClick={() => onNavigate('library')}
                whileHover={{ x: 5 }}
                style={{ cursor: 'pointer' }}
              >
                Browse Chants
              </motion.a>
            </li>
            <li>
              <motion.a 
                onClick={() => onNavigate('phonetics')}
                whileHover={{ x: 5 }}
                style={{ cursor: 'pointer' }}
              >
                Phonetics
              </motion.a>
            </li>
            <li>
              <motion.a 
                onClick={() => onNavigate('compositions')}
                whileHover={{ x: 5 }}
                style={{ cursor: 'pointer' }}
              >
                Compositions
              </motion.a>
            </li>
          </ul>
        </motion.div>

        <motion.div className="footer-column" variants={itemVariants}>
          <h4>Resources</h4>
          <ul className="footer-links">
            <li>
              <motion.a whileHover={{ x: 5 }} style={{ cursor: 'pointer' }}>
                Getting Started
              </motion.a>
            </li>
            <li>
              <motion.a whileHover={{ x: 5 }} style={{ cursor: 'pointer' }}>
                Notation Guide
              </motion.a>
            </li>
            <li>
              <motion.a whileHover={{ x: 5 }} style={{ cursor: 'pointer' }}>
                Contribute
              </motion.a>
            </li>
          </ul>
        </motion.div>

        <motion.div className="footer-column" variants={itemVariants}>
          <h4>About</h4>
          <ul className="footer-links">
            <li>
              <motion.a 
                onClick={() => onNavigate('about')}
                whileHover={{ x: 5 }}
                style={{ cursor: 'pointer' }}
              >
                Our Mission
              </motion.a>
            </li>
            <li>
              <motion.a whileHover={{ x: 5 }} style={{ cursor: 'pointer' }}>
                Contact
              </motion.a>
            </li>
            <li>
              <motion.a whileHover={{ x: 5 }} style={{ cursor: 'pointer' }}>
                Support Us
              </motion.a>
            </li>
          </ul>
        </motion.div>
      </div>

      <motion.div className="footer-bottom" variants={itemVariants}>
        <p className="footer-copyright">
          © {new Date().getFullYear()} Psaltikon Library. For the glory of God.
        </p>
        <p className="footer-doxology">
          "Let everything that has breath praise the Lord" — Psalm 150:6
        </p>
      </motion.div>
    </motion.footer>
  );
};

export default Footer;
