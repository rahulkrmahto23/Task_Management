import React from 'react';

const HomePage = () => {
  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: '#333' }}>
      
      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Delivering Excellence in Every Project</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: 600 }}>
          We help businesses grow through innovative solutions and exceptional services.
        </p>
        <button style={styles.ctaButton} onClick={() => alert('Get Started clicked!')}>Get Started</button>
      </section>

      {/* About Section */}
      <section id="about" style={styles.section}>
        <h2>About Us</h2>
        <p style={{ maxWidth: 700, margin: '0 auto' }}>
          Founded in 2020, YourCompany is dedicated to providing top-tier consulting and development services for clients worldwide. Our team of experts bring creativity, innovation, and a commitment to excellence.
        </p>
      </section>

      {/* Services Section */}
      <section id="services" style={{ ...styles.section, backgroundColor: '#f9f9f9' }}>
        <h2>Our Services</h2>
        <div style={styles.servicesGrid}>
          <div style={styles.serviceCard}>
            <h3>Consulting</h3>
            <p>Expert guidance to help you achieve your business goals efficiently.</p>
          </div>
          <div style={styles.serviceCard}>
            <h3>Development</h3>
            <p>Custom software solutions tailored to your specific needs.</p>
          </div>
          <div style={styles.serviceCard}>
            <h3>Support</h3>
            <p>Reliable and responsive support to keep your operations running smoothly.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={styles.section}>
        <h2>Contact Us</h2>
        <p style={{ maxWidth: 600, margin: '0 auto 1.5rem' }}>
          Have questions or want to work together? Reach out to us!
        </p>
        <form style={styles.contactForm} onSubmit={(e) => {
          e.preventDefault();
          alert('Form submitted!');
        }}>
          <input type="text" placeholder="Your Name" required style={styles.input} />
          <input type="email" placeholder="Your Email" required style={styles.input} />
          <textarea placeholder="Your Message" required style={styles.textarea}></textarea>
          <button type="submit" style={styles.ctaButton}>Send Message</button>
        </form>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} YourCompany. All rights reserved.</p>
      </footer>
    </div>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid #ddd',
    position: 'sticky',
    top: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
    color: '#007BFF',
    cursor: 'default',
  },
  navLinks: {
    listStyle: 'none',
    display: 'flex',
    gap: '1.5rem',
    margin: 0,
    padding: 0,
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    fontWeight: 500,
  },
  ctaButton: {
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'background-color 0.3s ease',
  },
  hero: {
    textAlign: 'center',
    padding: '6rem 2rem 4rem',
    backgroundColor: '#e9f1ff',
  },
  section: {
    padding: '4rem 2rem',
    maxWidth: 960,
    margin: '0 auto',
  },
  servicesGrid: {
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '2rem',
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    flex: '1 1 250px',
    minWidth: 250,
  },
  contactForm: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 500,
    margin: '0 auto',
    gap: '1rem',
  },
  input: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: 4,
    border: '1px solid #ccc',
  },
  textarea: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: 4,
    border: '1px solid #ccc',
    minHeight: 120,
    resize: 'vertical',
  },
  footer: {
    textAlign: 'center',
    padding: '2rem 1rem',
    backgroundColor: '#222',
    color: '#eee',
    marginTop: '4rem',
  },
};

export default HomePage;
