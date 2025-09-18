import React from "react";
import styles from "./Services.module.css";
import appStyles from "./App.module.css";

const serviceList = [
  {
    icon: "📅",
    title: "Project Scheduling",
    desc: "Plan, schedule, and track project timelines with Gantt charts and calendar views. Ensure every milestone is met and resources are allocated efficiently.",
  },
  {
    icon: "👥",
    title: "Team Collaboration",
    desc: "Enable seamless communication and file sharing among project members. Assign tasks, set priorities, and keep everyone aligned with real-time updates.",
  },
  {
    icon: "📈",
    title: "Progress & Reporting",
    desc: "Monitor project health with dashboards and custom reports. Visualize progress, identify bottlenecks, and share insights with stakeholders.",
  },
];

const Services: React.FC = () => {
  return (
    <main className={`${appStyles.main} ${styles.servicesPage}`}>
      {/* Centered Header */}
      <section className={styles.servicesHero}>
        <h1 className={styles.servicesTitle}>Our Services</h1>
        <p className={styles.servicesLead}>
          Easily create, assign, and track tasks for every project. Our
          intuitive interface lets you set deadlines, prioritize tasks, and
          monitor progress in real time. Gain a clear overview of who is doing
          what and when, eliminating communication gaps and keeping everyone
          aligned.
        </p>
        <button className={styles.contactBtn}>Contact Us</button>
      </section>

      {/* Services List - Each service in its own row container */}
      <section className={styles.servicesRows}>
        {serviceList.map((service) => (
          <div className={styles.servicesRowContainer} key={service.title}>
            <div className={styles.servicesIconAlt}>{service.icon}</div>
            <div>
              <h2 className={styles.servicesCardTitle}>{service.title}</h2>
              <p className={styles.servicesCardDesc}>{service.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Services;
