"use client"

import { useEffect, useState } from "react";
import { useAuth } from "./services/firebaseConfig";
import Image from "next/image";

interface AtividadeType {
  uid: string;
  name: string,
  topic: string,
  daysToNext: number,
  lastActivity: string,
  nextActivity: string,
}

export default function Home() {
  const { user, loading } = useAuth();
  const [ uidUser, setUidUser ] = useState("");
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const [editIndex, setEditIndex] = useState(-1);

  const [activities, setActivities] = useState<AtividadeType[]>([]);

  const initialActivity = {
    uid: "",
    name: "",
    topic: "",
    daysToNext: 0,
    lastActivity: "",
    nextActivity: "",
  };

  const [activity, setActivity] = useState<AtividadeType>(initialActivity);

  useEffect(() => {

    if (!loading && !user) {
      window.location.href = "/login";
    }

    if (user)
      setUidUser(user['uid']);

    getActivities();

  }, [loading, user]);

  function getActivities() {
    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities.json`)
    .then((res) => res.json())
    .then((data) => {
      const lista = [];

      for (const key in data) {
        const activity = { ... data[key], uid: key };
        if (user != null && activity.uidUser === user.uid) {
          lista.push(activity);

        }
      }

      setActivities(lista);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
  }

  function handleAddEditActivity() {
    const lastDate = new Date(activity.lastActivity);
    lastDate.setDate(lastDate.getDate() + activity.daysToNext); 

    const nextDateStr = lastDate.toISOString().split("T")[0];

    const { uid, ...activityWithoutUid } = activity;
    const newActivity = {
      ...activityWithoutUid,
      nextActivity: nextDateStr,
    };

    if (editIndex == -1)
      addActivity(newActivity);
    else
      editActivity(newActivity, activity.uid);

    setActivity(initialActivity);
  }

  function addActivity(newActivity: any) {
    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities.json`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uidUser: uidUser,
        ... newActivity,
      })
      
    })
    .then((res) => {
      if (res.ok) {
        console.log("Item added successfully");

        getActivities();

      } else {
        console.error("Error adding item");
      }
    })
  }

  function editActivity(editedActivity: any, uid: string) {
    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities/${uid}.json`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uidUser: uidUser,
        ...editedActivity,
      })
    })
    .then((res) => {
      if (res.ok) {
        console.log("Item edited successfully");
        setEditIndex(-1);
        getActivities();
      } else {
        console.error("Error editing item");
      }
    })
  }

  function deleteActivity(index: number) {
    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities/${activities[index].uid}.json`, {
      method: 'DELETE',
    })
    .then((res) => {
      if (res.ok) {
        console.log("Item deleted successfully");
        getActivities();
      } else {
        console.log("Error deleting item");
      }
    })
  }

  function doneTodayActivity(index: number) {
    const copyActivity = activities[index];
    const today = new Date();
    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
  
    copyActivity.lastActivity = todayString;


    const lastDate = new Date(copyActivity.lastActivity);
    lastDate.setDate(lastDate.getDate() + copyActivity.daysToNext); 

    const nextDateStr = lastDate.toISOString().split("T")[0];
    
    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities/${copyActivity.uid}.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        nextActivity: nextDateStr,
        lastActivity: todayString,
      })
    })
    .then((res) => {
      if (res.ok) {
        console.log("Item updated successfully");
        getActivities();
      } else {
        console.error("Error updating item");
      }
    })
  }
  

  function getColor(dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (date < today)
      return "bg-red-100";

    if (date > today)
      return "bg-green-100";

    return "bg-yellow-100";
  }

  return (
    <div className="flex flex-col gap-5 justify-center items-center mt-4">
      <div className={`w-[300px] text-xs flex flex-col items-center gap-2 p-1 rounded-xl`}>
        <div className="flex flex-col items-center">
          <span className="font-bold">Activity Name</span>
          <input
            className="w-[250px] h-[25px] bg-white border-1 pl-1"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActivity({ ...activity, name: e.target.value })}
            value={activity.name}
          />
        </div>

        <div className="flex flex-col items-center">
          <span className="font-bold">Category</span>
          <input
            className="w-[250px] h-[25px] bg-white border-1 pl-1"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActivity({ ...activity, topic: e.target.value })}
            value={activity.topic}
          />
        </div>

        <div className="flex flex-col items-center">
          <span className="font-bold">Interval (days)</span>
          <input
            className="w-[250px] h-[25px] bg-white border-1 pl-1"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = Number(e.target.value);
              setActivity({ ...activity, daysToNext: Number.isInteger(value) ? value : 0 })}
            }
            value={activity.daysToNext}
          />
        </div>

        <div className="flex flex-col items-center">
          <span className="font-bold">Last Done</span>
          <input
            type="date"
            className="w-[250px] h-[25px] bg-white border-1 pl-1"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActivity({ ...activity, lastActivity: e.target.value })}
            value={activity.lastActivity}
          />
        </div>

        <div onClick={handleAddEditActivity} className="w-[250px] h-[25px] bg-black text-white text-sm rounded-lg flex justify-center items-center mt-2 cursor-pointer">{editIndex != -1 ? "Editar" : "Adicionar"}</div>
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center mb-2">
        {
          activities.map((atividade, index) => {
            return (
              <div key={index} className={`w-[250px] text-sm flex flex-col gap-1 p-1 rounded-sm ${getColor(atividade.nextActivity)}`}>
                <div className="flex flex-col">
                  <span className="text-gray-500 font-bold flex justify-center">Activity Name</span>
                  <span className="flex justify-center">{atividade.name}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-500 font-bold flex justify-center">Category</span>
                  <span className="flex justify-center">{atividade.topic}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-500 font-bold flex justify-center">Interval (days)</span>
                  <span className="flex justify-center">{atividade.daysToNext}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-500 font-bold flex justify-center">Last Done</span>
                  <span className="flex justify-center">{atividade.lastActivity}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-500 font-bold flex justify-center">Next Due</span>
                  <span className="flex justify-center">{atividade.nextActivity}</span>
                </div>

                <div className="mt-2 flex justify-center gap-3">
                  <Image src="/edit.png" alt="edit" width={15} height={15} className={`cursor-pointer ${editIndex == index ? 'bg-yellow-400' : null}`}
                    onClick={() => {
                        if (editIndex == index) {
                          setEditIndex(-1);
                          setActivity(initialActivity);
                        }
                        else {
                          setEditIndex(index);
                          setActivity(activities[index]);
                        }

                      }}
                  />

                  <Image src="/delete.png" alt="delete" width={15} height={15} className="cursor-pointer"
                    onClick={() => {
                        deleteActivity(index);
                      }}
                  />

                  <Image src="/check-mark.png" alt="check" width={15} height={15} className="cursor-pointer"
                    onClick={() => {
                        doneTodayActivity(index);
                      }}
                  />

                </div>
              </div>
            )
          })
        }
      </div>
      
    </div>
  )
}