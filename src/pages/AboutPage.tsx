import { motion } from 'framer-motion';
import { Easing } from 'framer-motion';

const easeOut: Easing = [0.16, 1, 0.3, 1];


const AboutPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: easeOut }
    },
  };

  const missionPoints = [
    "Share chant resources freely with all who seek them",
    "Preserve authentic Orthodox psaltic tradition for future generations",
    "Help more people participate in the liturgical life through accessible notation",
    "Provide phonetic resources for those who cannot read certain liturgical languages",
    "Keep everything faithful to Orthodox liturgical ethos and Tradition"
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="about-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <motion.span
            style={{ fontSize: '3rem', display: 'block', marginBottom: '1.5rem' }}
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4,
              ease: "easeInOut"
            }}
          >
            ☦
          </motion.span>
          <h1 style={{ marginBottom: '1rem' }}>Our Mission</h1>
          <p style={{ 
            fontFamily: 'var(--font-accent)', 
            fontSize: '1.35rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Preserving, sharing, and making Orthodox Byzantine chant more accessible 
            for the glory of God and the edification of the faithful.
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <motion.section 
        className="about-content"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        style={{ marginTop: '1.5rem' }}
      >
        {/* Introduction */}
        <motion.div className="about-section" variants={itemVariants}>
          <h3>☦ A Sacred Treasury</h3>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            The Psaltikon Library exists as a humble offering to the Orthodox Church — a digital 
            treasury where the ancient and beautiful tradition of Byzantine chant can be preserved, 
            studied, and shared freely among all who seek to glorify God through sacred music.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            Byzantine chant is not merely music; it is prayer set to melody, theology sung aloud, 
            and a direct connection to centuries of Orthodox worship. Our goal is to make this 
            precious inheritance accessible to chanters, choir directors, clergy, and faithful 
            around the world.
          </p>
        </motion.div>

        {/* Quote */}
        <motion.div 
          className="quote-block"
          variants={itemVariants}
          style={{ margin: '3rem 0' }}
        >
          <span className="quote-icon">☦</span>
          <p className="quote-text">
            "Praise the Lord with the sound of the trumpet; praise Him with the psaltery and harp."
          </p>
          <p className="quote-source">— Psalm 150:3</p>
        </motion.div>

        {/* Accessibility Focus */}
        <motion.div className="about-section" variants={itemVariants}>
          <h3>☦ Accessibility for All</h3>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            One of our primary concerns is accessibility. Not everyone can read Greek, Arabic, 
            Church Slavonic, or even Byzantine notation. This should not prevent any Orthodox 
            Christian from participating fully in the liturgical life of the Church.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            For this reason, we are committed to providing resources that bridge these gaps — 
            including phonetic transliterations of Arabic chants that allow non-Arabic speakers 
            to learn and sing these beautiful hymns. Our hope is that language will never be a 
            barrier to praising God in the traditional music of the Church.
          </p>
        </motion.div>

        {/* Mission Points */}
        <motion.div className="about-section" variants={itemVariants}>
          <h3>☦ What We Strive For</h3>
          <ul className="about-list">
            {missionPoints.map((point, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                style={{ fontSize: '1.05rem', lineHeight: 1.8 }}
              >
                {point}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Quote */}
        <motion.div 
          className="quote-block"
          variants={itemVariants}
          style={{ margin: '3rem 0' }}
        >
          <span className="quote-icon">☦</span>
          <p className="quote-text">
            "Singing belongs to one who loves."
          </p>
          <p className="quote-source">— St. Augustine of Hippo</p>
        </motion.div>

        {/* Service */}
        <motion.div className="about-section" variants={itemVariants}>
          <h3>☦ In Service of the Church</h3>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            This project exists for one purpose: the service of the Orthodox Church and its 
            liturgical tradition. We are not a commercial enterprise, nor an academic institution. 
            We are simply Orthodox Christians who love the sacred music of our faith and wish to 
            share it with others.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            All resources are provided freely, in the spirit of the Church's ancient tradition 
            of sharing spiritual treasures without charge. We ask only for your prayers and, 
            if you are able, your support in expanding this library for the benefit of all.
          </p>
        </motion.div>

        {/* Future Vision */}
        <motion.div className="about-section" variants={itemVariants}>
          <h3>☦ Looking Forward</h3>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            We envision a future where this library becomes a comprehensive resource for 
            Orthodox Byzantine chant — catalogued by feast, service, and part of the service; 
            searchable by tone and language; and equipped with tools like custom booklet 
            generation for choir directors preparing for services.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            This is a labor of love that will grow slowly and carefully, always keeping the 
            sacred nature of this music at the forefront. We welcome contributions from chanters, 
            scholars, and faithful who share our vision.
          </p>
        </motion.div>

        {/* Final Quote */}
        <motion.div 
          className="quote-block"
          variants={itemVariants}
          style={{ margin: '3rem 0' }}
        >
          <span className="quote-icon">☦</span>
          <p className="quote-text">
            "Let everything that has breath praise the Lord!"
          </p>
          <p className="quote-source">— Psalm 150:6</p>
        </motion.div>

        {/* Doxology */}
        <motion.div 
          className="doxology"
          variants={itemVariants}
        >
          <motion.div
            className="doxology-cross"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [1, 0.8, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3,
              ease: "easeInOut"
            }}
          >
            ☦
          </motion.div>
          <p className="doxology-text" style={{ marginTop: '1rem' }}>
            "To the glory of the Holy Trinity and for the edification of the faithful."
          </p>
        </motion.div>

        {/* Contact Section */}
        <motion.div 
          variants={itemVariants}
          style={{ 
            marginTop: '4rem',
            padding: '2rem',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            textAlign: 'center'
          }}
        >
          <h3 style={{ marginBottom: '1rem' }}>Get Involved</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            If you would like to contribute chants, offer corrections, or support this project, 
            we would be grateful to hear from you.
          </p>
          <motion.button
            className="btn btn-primary"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => alert('Contact form coming soon!')}
          >
            Contact Us
            <span className="coming-soon-badge">Soon</span>
          </motion.button>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default AboutPage;