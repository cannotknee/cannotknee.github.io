import React from "react";
import { Bar } from 'react-chartjs-2';

const BarChart = () => {
    const data = {
        labels: ["HTML", "CSS", "Javascript", "Python", "SQL", "React", "NodeJS", "Express"],
        datasets: [
            {
                label: "Skill level",
                data: [90, 90, 80, 80, 80, 70, 60, 60, 30],
                backgroundColor: [
                    "rgba(193, 68, 14, 0.5)",
                ],
                borderColor: [
                    "rgba(236, 131, 144, 1)",
                ],
                borderWidth: 1.5,
            }
        ]
    };
    const options = {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      legend: {
        display: false
      },
      scales: {
        x: {
          display: false,
          grid: {
            display: false
          },
          ticks: {
            color: '#fff',
          },
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#fff',
          },
        }
      },
    };
  return (
    <div className="barchart">
      <Bar data={data} options={options}/>
    </div>
  );
};

export default BarChart;