export type ExampleItem = {
  id: string;
  label: string;
  language: string;
  code: string;
};

export type ExampleGroup = {
  groupLabel: string;
  language: string;
  items: ExampleItem[];
};

export const EXAMPLE_GROUPS: ExampleGroup[] = [
  {
    groupLabel: "JavaScript / TypeScript",
    language: "typescript",
    items: [
      {
        id: "react",
        label: "React Component",
        language: "typescript",
        code: `import { useState, useEffect } from "react";

async function fetchUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json();
}

export default function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
    </div>
  );
}`,
      },
      {
        id: "express",
        label: "Express Route",
        language: "typescript",
        code: `import express from "express";

const router = express.Router();

async function validateUser(id: string) {
  const res = await fetch(\`/internal/users/\${id}\`);
  if (!res.ok) {
    return null;
  }
  return res.json();
}

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await validateUser(id);

  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(user);
});

export default router;`,
      },
      {
        id: "algo",
        label: "Sorting Algorithm",
        language: "typescript",
        code: `function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) {
    return arr;
  }
  
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  
  return [...quicksort(left), pivot, ...quicksort(right)];
}

const sorted = quicksort([5, 2, 9, 1, 5, 6]);
console.log(sorted);`,
      }
    ]
  },
  {
    groupLabel: "HTML",
    language: "html",
    items: [
      {
        id: "html-basic",
        label: "Basic Page",
        language: "html",
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Easy HTML</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #1a1a1a; color: white; }
    .box { border: 1px solid #444; padding: 1rem; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Welcome to HTML</h1>
  <div class="box">
    <p>This is a simple paragraph.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </div>
</body>
</html>`
      },
      {
        id: "html-form",
        label: "Login Form",
        language: "html",
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login</title>
</head>
<body>
  <div class="login-container">
    <h2>Sign In</h2>
    <form action="/login" method="POST">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>`
      }
    ]
  },
  {
    groupLabel: "C++",
    language: "cpp",
    items: [
      {
        id: "cpp-basic",
        label: "Basic Math & Loop",
        language: "cpp",
        code: `#include <iostream>
using namespace std;

int addNumbers(int a, int b) {
    return a + b;
}

int main() {
    int a = 5;
    int b = 10;
    int sum = addNumbers(a, b);
    
    cout << "The sum is: " << sum << endl;
    
    for (int i = 0; i < 3; i++) {
        cout << "Loop: " << i << endl;
    }
    
    return 0;
}`
      },
      {
        id: "cpp-oop",
        label: "Object Oriented",
        language: "cpp",
        code: `#include <iostream>
#include <string>
using namespace std;

class Animal {
private:
    string name;
public:
    Animal(string n) {
        name = n;
    }
    
    void speak() {
        cout << name << " makes a noise." << endl;
    }
};

class Dog : public Animal {
public:
    Dog(string n) : Animal(n) {}
    
    void speak() {
        cout << "Dog barks!" << endl;
    }
};

int main() {
    Animal a("Generic");
    a.speak();
    
    Dog d("Rex");
    d.speak();
    
    return 0;
}`
      }
    ]
  },
  {
    groupLabel: "Java",
    language: "java",
    items: [
      {
        id: "java-basic",
        label: "Basic Syntax",
        language: "java",
        code: `public class Main {
    public static void main(String[] args) {
        String greeting = "Hello, World!";
        System.out.println(greeting);
        
        int[] numbers = {1, 2, 3, 4, 5};
        
        for (int number : numbers) {
            if (number % 2 == 0) {
                System.out.println(number + " is even.");
            } else {
                System.out.println(number + " is odd.");
            }
        }
    }
}`
      },
      {
        id: "java-bank",
        label: "Bank Account",
        language: "java",
        code: `class BankAccount {
    private String owner;
    private double balance;

    public BankAccount(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            System.out.println("Deposited: $" + amount);
        }
    }

    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            System.out.println("Withdrew: $" + amount);
        } else {
            System.out.println("Insufficient funds!");
        }
    }

    public double getBalance() {
        return balance;
    }
}

public class Main {
    public static void main(String[] args) {
        BankAccount myAccount = new BankAccount("Alice", 100.0);
        myAccount.deposit(50.0);
        myAccount.withdraw(30.0);
        System.out.println("Final Balance: $" + myAccount.getBalance());
    }
}`
      }
    ]
  },
  {
    groupLabel: "Python",
    language: "python",
    items: [
      {
        id: "python-basic",
        label: "Fibonacci Sequence",
        language: "python",
        code: `def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    seq = [0, 1]
    for i in range(2, n):
        next_val = seq[-1] + seq[-2]
        seq.append(next_val)
        
    return seq

# Print first 10 Fibonacci numbers
first_10 = fibonacci(10)
print("Fibonacci sequence:", first_10)

count = 0
while count < 3:
    print("Looping...", count)
    count += 1`
      }
    ]
  },
  {
    groupLabel: "SQL",
    language: "sql",
    items: [
      {
        id: "sql-basic",
        label: "Basic Queries",
        language: "sql",
        code: `-- Create a users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some data
INSERT INTO users (username, email) 
VALUES ('johndoe', 'john@example.com'),
       ('janedoe', 'jane@example.com');

-- Retrieve active users
SELECT id, username, email 
FROM users 
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;`
      }
    ]
  }
];

export function getExampleById(id: string): ExampleItem | undefined {
  for (const group of EXAMPLE_GROUPS) {
    for (const item of group.items) {
      if (item.id === id) {
        return item;
      }
    }
  }
  return undefined;
}
