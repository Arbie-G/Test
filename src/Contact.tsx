import React, { useState } from "react";
import styles from "./Contact.module.css";
import appStyles from "./App.module.css";

const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className={`${appStyles.main} ${styles.contactPage}`}>
      <h1 className={styles.contactTitle}>Contact us</h1>
      <p className={styles.contactLead}>
        If you have any questions, queries or suggestions please do not hesitate
        to contact us through the form below.
      </p>
      <section className={styles.contactGrid}>
        <form className={styles.contactForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>
                𝒊 Name <span className={styles.required}>*</span>
              </label>
              <div className={styles.nameFields}>
                <input
                  type="text"
                  placeholder="First"
                  required
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Last"
                  required
                  className={styles.input}
                />
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>
              ✉︎ Email <span className={styles.required}>*</span>
            </label>
            <input type="email" required className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label>
              ⌨ Comment <span className={styles.required}>*</span>
            </label>
            <textarea required rows={5} className={styles.input} />
          </div>
          <button type="submit" className={styles.submitBtn}>
            SUBMIT
          </button>
          <div className={styles.formNote}>
            Please DO NOT fill in the above form with regards to exchanges.
            Instead click on the
            <a href="#" className={styles.link}>
              {" "}
              "SUBMIT A SIZING EXCHANGE"{" "}
            </a>
            button on the right for a faster response
          </div>
        </form>
        <div className={styles.contactInfo}>
          <div className={styles.infoBlock}>
            <h2 className={styles.infoTitle}>Want a quick answer?</h2>
            <p>
              The chances are we have already answered your questions under our
              FAQ or Frequently Asked Questions which can be viewed at the link
              below.
            </p>
            <button className={styles.infoBtn}>
              FREQUENTLY ASKED QUESTIONS
            </button>
          </div>
        </div>
      </section>
      {submitted && (
        <div className={styles.contactSuccess}>
          <h2>Thank you!</h2>
          <p>Your message has been sent. We’ll be in touch soon.</p>
        </div>
      )}
    </main>
  );
};

export default Contact;
