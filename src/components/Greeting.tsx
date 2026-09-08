'use client';

import { useEffect, useState } from 'react';

type GreetingProps = {
  name: string;
};

const Greeting = ({ name }: GreetingProps) => {
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting('Good Morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good Afternoon');
      } else if (hour >= 17 && hour < 21) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Good Night');
      }
    };

    updateGreeting();

    const interval = setInterval(updateGreeting, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h4 className="pb-1 text-sm font-medium text-[#393536]">{greeting}</h4>

      <h2 className="text-3xl font-semibold tracking-tight text-[#393536]">
        {name}!
      </h2>
    </div>
  );
};

export default Greeting;
