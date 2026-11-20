import { Page } from '../types';
import OrthodoxCross from './OrthodoxCross';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

const CONTACT_EMAIL = 'theorthodoxheritage@outlook.com';

const Footer = ({ onNavigate }: FooterProps) => {
  const links: { heading: string; items: { label: string; page: Page }[] }[] = [
    {
      heading: 'Library',
      items: [
        { label: 'Browse chants', page: 'library' },
        { label: 'Booklets', page: 'booklets' },
        { label: 'Services', page: 'services' },
      ],
    },
    {
      heading: 'About',
      items: [{ label: 'Our mission', page: 'about' }],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <figure className="site-footer__verse">
          <blockquote>Let everything that has breath praise the Lord.</blockquote>
          <figcaption>Psalm 150:6</figcaption>
        </figure>

        <div className="site-footer__cols">
          <div className="site-footer__brand">
            <div className="site-footer__name">
              <OrthodoxCross size={20} />
              <span>Psaltikon Library</span>
            </div>
            <p>
              Preserving, sharing, and making Orthodox Byzantine chant more accessible, for the glory of God and the
              edification of the faithful.
            </p>
          </div>

          {links.map((group) => (
            <nav className="site-footer__nav" aria-label={group.heading} key={group.heading}>
              <h2>{group.heading}</h2>
              <ul>
                {group.items.map((item) => (
                  <li key={item.label}>
                    <button type="button" onClick={() => onNavigate(item.page)}>
                      {item.label}
                    </button>
                  </li>
                ))}
                {group.heading === 'About' && (
                  <li>
                    <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
                  </li>
                )}
              </ul>
            </nav>
          ))}
        </div>

        <p className="site-footer__legal">
          © {new Date().getFullYear()} Psaltikon Library. Free for every chanter, choir and parish.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
