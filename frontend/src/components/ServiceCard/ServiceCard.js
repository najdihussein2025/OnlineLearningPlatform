import React from 'react';
import './ServiceCard.css';

const ServiceCard = ({ service }) => {
  return (
    <div className="service-card">
      <div className="service-card-icon">
        {service.icon}
      </div>
      <h3 className="service-card-title">{service.title}</h3>
      <p className="service-card-description">{service.description}</p>
    </div>
  );
};

export default ServiceCard;

