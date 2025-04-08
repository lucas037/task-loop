"use client"

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./services/firebaseConfig";
import Image from "next/image";

interface AtividadeType {
  uid: string;
  name: string,
  description: string,
  daysToNext: number,
  lastActivity: string,
  nextActivity: string,
  position: number,
  lastRelapse: string,
  daysStatus: boolean[],
  type: string,
  streak: number,
}

interface NoUidActivityType {
  name: string,
  description: string,
  daysToNext: number,
  lastActivity: string,
  nextActivity: string,
  position: number,
  lastRelapse: string,
  daysStatus: boolean[],
  type: string,
  streak: number,
}

interface CategoryDataType {
  name: string,
  data: AtividadeType[],
  position: number,
}

export default function Home() {
  const { user, loading } = useAuth();
  const [ uidUser, setUidUser ] = useState("");
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const [editIndexes, setEditIndexes] = useState([-1, -1]);
  const [topic, setTopic] = useState("");
 
  const [categories, setCategories] = useState<CategoryDataType[]>([]);

  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

  const initialActivity = {
    uid: "",
    name: "",
    description: "",
    daysToNext: 0,
    lastActivity: yesterday.toISOString().slice(0, 10),
    nextActivity: yesterday.toISOString().slice(0, 10),
    position: 0,
    lastRelapse: yesterday.toISOString().slice(0, 10),
    daysStatus: Array(7).fill(false),
    type: "",
    streak: 0,
  };

  const [activity, setActivity] = useState<AtividadeType>(initialActivity);

  const getActivities = useCallback(() => {
    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities.json`)
    .then((res) => res.json())
    .then((data) => {
      let categoriesData: CategoryDataType[] = [];

      if (data == null) {
        setCategories([]);
        return;
      }

      Object.keys(data).forEach((categoryName) => {
        
        const newCategory: CategoryDataType = {
          name: categoryName,
          data: [],
          position: data[categoryName]['position'],
        };


        Object.keys(data[categoryName]['activities-data']).forEach((activityId) => {
          const newActivity: AtividadeType = data[categoryName]['activities-data'][activityId];
          newActivity.uid = activityId;
          newCategory.data = [ ... newCategory.data, newActivity ];
        })

        newCategory.data.sort((a, b) => a.position - b.position);
        categoriesData = [ ... categoriesData, newCategory ];

      })
      
      categoriesData.sort((a, b) => a.position - b.position)

      setCategories(categoriesData);

    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
  }, [user])

  useEffect(() => {

    if (!loading && !user) {
      window.location.href = "/login";
    }

    if (user)
      setUidUser(user['uid']);

    getActivities();

  }, [loading, getActivities]);

  function handleAddEditActivity() {
    const lastDate = new Date(activity.lastActivity);
    lastDate.setDate(lastDate.getDate() + activity.daysToNext); 

    const nextDateStr = lastDate.toISOString().split("T")[0];

    const { uid, ...activityWithoutUid } = activity;
    void uid;
    const newActivity = {
      ...activityWithoutUid,
      nextActivity: nextDateStr,
    };

    if (editIndexes[0] == -1)
      addActivity(newActivity);
    else
      editActivity(newActivity);

    setActivity(initialActivity);
  }

  function getPositionCategory(category: string) {
    let position = -1;

    for (let i = 0; i < categories.length; i++) {
      if (category == categories[i].name)
        return categories[i].position;
      
      if (categories[i].position > position)
        position = categories[i].position;
    }

    return position + 1;
  }

  function calcStreak(activity: NoUidActivityType) {
    const lastRelapseDate = new Date(activity.lastRelapse);

    return Math.floor(
      (today.getTime() - lastRelapseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

  }

  function addActivity(newActivity: NoUidActivityType) {
    let value = -1;

    let categoryCode = -1;
    for (let i = 0; i < categories.length; i++)
      if (categories[i].name == topic) {
        categoryCode = i;
        break;
      }

    if (categoryCode != -1) {
      for (let i = 0; i < categories[categoryCode].data.length; i++) {
        if (categories[categoryCode].data[i].position > value) {
          value = categories[categoryCode].data[i].position;
        }
        
      }
    }

    value += 1;
    newActivity.position = value;

    if (activity.type == 'days')
      newActivity.streak = calcStreak(activity);

    const updates = {
      [`/activities/${topic}/activities-data/${crypto.randomUUID()}`]: {
        uidUser,
        ...newActivity,
      },
      [`/activities/${topic}/position`]: getPositionCategory(topic)
    };

    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/.json`, {
      method: 'PATCH',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updates)
      
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

  function editActivity(editedActivity: NoUidActivityType) {
    
    const category = categories[editIndexes[0]];
    const activity = category.data[editIndexes[1]];

    if (topic != category.name) {
      deleteActivity(editIndexes[0], editIndexes[1]);
      addActivity(editedActivity);
      return;
    }

    if (activity.type == 'days')
      editedActivity.streak = calcStreak(activity);

    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities/${category.name}/activities-data/${activity.uid}.json`, {
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
        setEditIndexes([-1, -1]);
        getActivities();
      } else {
        console.error("Error editing item");
      }
    })
  }

  function deleteActivity(indexTopic: number, index: number) {
    const category = categories[indexTopic];
    const activity = category.data[index];

    let removeUrl = `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities/${category.name}`;

    if (category.data.length >= 2) {
      removeUrl += `/activities-data/${activity.uid}`;
    }

    removeUrl += '.json';

    fetch(removeUrl, {
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

  function doneTodayActivity(index: number, indexTopic: number) {
    const category = categories[indexTopic];
    const activityCopy = category.data[index];

    const today = new Date();
    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    if (activityCopy.lastActivity < todayString)
      activityCopy.lastActivity = todayString;
    else if (activityCopy.type != 'days') {
      const newLastDate = new Date(activityCopy.lastActivity);
      newLastDate.setDate(newLastDate.getDate() + 1); 
      
      activityCopy.lastActivity = newLastDate.toISOString().split("T")[0];
    }

    const lastDate = new Date(activityCopy.lastActivity);
    lastDate.setDate(lastDate.getDate() + activityCopy.daysToNext); 

    const nextDateStr = lastDate.toISOString().split("T")[0];
    
    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities/${category.name}/activities-data/${activityCopy.uid}.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        nextActivity: nextDateStr,
        lastActivity: activityCopy.lastActivity,
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

  function notDoneTodayActivity(index: number, indexTopic: number) {
    const category = categories[indexTopic];
    const activityCopy = category.data[index];

    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;


    fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities/${category.name}/activities-data/${activityCopy.uid}.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        lastRelapse: todayString,
        streak: 0,
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

  async function changePositionActivity(a: number, b: number, indexTopic: number) {
    if (a < 0)
      return;

    if (b >= categories[indexTopic].data.length)
      return;


    const posA = categories[indexTopic].data[a].position;
    const posB = categories[indexTopic].data[b].position;

    await updatePosition(a, posB, indexTopic);
    await updatePosition(b, posA, indexTopic);

    getActivities();
  }

  function updatePosition(index: number, newPosition: number, indexTopic: number): Promise<void> {
    const category = categories[indexTopic];
    const activity = category.data[index];

    return fetch(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/activities/${category.name}/activities-data/${activity.uid}.json`, {
      method: 'PATCH',
      body: JSON.stringify({ position: newPosition })
    })
      .then((res) => {
        if (res.ok) {
          console.log("Item atualizado com nova posição");
        }
        else {
          alert("erro ao atualizar posição.");
        }
      });
  }

  function getColor(activity: AtividadeType) {
    if (activity.type == 'interval')
      return getColorInterval(activity.nextActivity);

    const weekDay = today.getDay();

    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    if (activity.lastRelapse == todayString)
      return 'bg-red-100';
      
    if (activity.daysStatus[weekDay] && activity.lastActivity != todayString) {
      return 'bg-yellow-100';
    }

    return 'bg-green-100';
  }
  
  function getColorInterval(dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (date < today)
      return "bg-red-100";

    if (date > today)
      return "bg-green-100";

    return "bg-yellow-100";
  }

  function getCategoryColor(index: number) {
    let yellow = false;
    let green = false;

    for (let i = 0; i < categories[index].data.length; i++) {
      const colorItem = getColor((categories[index].data[i]));
      if (colorItem == 'bg-red-100')
        return colorItem;

      else if (colorItem == 'bg-yellow-100')
        yellow = true;

      else if (colorItem == 'bg-green-100')
        green = true;
    }

    if (yellow)
      return 'bg-yellow-100';

    if (green)
      return 'bg-green-100';

    return 'bg-blue-100';
  }
  
  function getSequenceDays(sequenceDays: boolean[]) {
    function addSequence(init: number, end: number) {
      let sequenceLocal = "";

      sequenceLocal += days[init];

      if (end != -1) {
        if (end - init == 1)
          sequenceLocal += ', ';
        else
          sequenceLocal += '-';
  
        sequenceLocal += days[end];
      }

      return sequenceLocal;
      
    }

    let sequence = "";
    let init = -1;
    let end = -1;

    for (let i = 0; i < sequenceDays.length; i++) {
      if (sequenceDays[i]) {
        if (init == -1)
          init = i;
        else {
          end = i;

        }
      }
      
      if (!sequenceDays[i] || i == sequenceDays.length - 1 ){
        if (init != -1) {
          const newSequence = addSequence(init, end);

          if (sequence == '')
            sequence += newSequence;
          else
            sequence += ', '+newSequence

        }

        init = -1;
        end = -1;
      }

    }

    return sequence;

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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
            value={topic}
          />
        </div>

        <div className="flex flex-col items-center">
          <span className="font-bold">Description</span>
          <input
            className="w-[250px] h-[25px] bg-white border-1 pl-1"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActivity({ ...activity, description: e.target.value })}
            value={activity.description}
          />
        </div>
        
        {
          <div className="flex flex-col items-center">
            <span className="font-bold">Type</span>
            <select
              className="w-[250px] h-[25px] bg-white border-1 pl-1" name="type"
              value={activity.type}
              onChange={(e) => setActivity( { ... activity, type: e.target.value } ) }>
                <option value=""></option>
                <option value="interval">Interval</option>
                <option value="days">Days</option>
            </select>
          </div>
        }

        { activity.type == "interval" &&
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
        }

        { activity.type == "interval" &&
          <div className="flex flex-col items-center">
            <span className="font-bold">Last Done</span>
            <input
              type="date"
              className="w-[250px] h-[25px] bg-white border-1 pl-1"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActivity({ ...activity, lastActivity: e.target.value })}
              value={activity.lastActivity}
            />
          </div>
        }

        { activity.type == "days" &&
          <div className="flex flex-col items-center">
            <span className="font-bold">Active days</span>

              <div className="mt-1 flex gap-2">
                {
                  days.map((day, index) => {
                    return (
                      <div className="flex flex-col items-center" key={index}>
                        <span>{day}</span>
                        <select
                          className="w-[60px] h-[25px] bg-white border-1 pl-1"
                          value={ 
                            activity.daysStatus[index] ? 'true' : 'false'
                          }
                          onChange={(e) => {
                            const newActivity = { ... activity };
                            newActivity.daysStatus[index] = e.target.value == "true";
                            setActivity(activity);
                          }}
                        >
                          <option value="true">Sim</option>
                          <option value="false">Não</option>
                        </select>
                      </div>
                    )
                  })
                }
              </div>
            
            
          </div>

        }

        { activity.type == "days" &&
          <div className="flex flex-col items-center">
          <span className="font-bold">Day of last relapse</span>
          <input
            type="date"
            className="w-[250px] h-[25px] bg-white border-1 pl-1"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActivity({ ...activity, lastRelapse: e.target.value })}
            value={activity.lastRelapse}
          />
        </div>
        }

        <div onClick={handleAddEditActivity} className="w-[250px] h-[25px] bg-black text-white text-sm rounded-lg flex justify-center items-center mt-2 cursor-pointer">{editIndexes[0] != -1 ? "Editar" : "Adicionar"}</div>
      </div>
      
      <div className="flex flex-col gap-6">
        {
          categories.map((category, indexTopic) => {
            return (
              <div key={indexTopic} className="w-screen flex flex-col justify-center items-center">
                <div className={`w-[90%] h-12 ${getCategoryColor(indexTopic)} shadow-lg border-gray-300 font-bold pl-2 text-2xl flex items-center rounded-lg`}>{category.name}</div>
                
                <div className="flex flex-wrap gap-4 justify-center mb-10 mt-4">
                  {
                    category.data.map((activity, index) => {
                      return (
                        <div key={index} className={`w-[250px] shadow-lg border-gray-300 text-sm flex flex-col justify-between gap-1 p-1 rounded-sm ${getColor(activity)}`}>
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-bold flex justify-center">Activity Name</span>
                            <span className="flex justify-center">{activity.name}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-gray-500 font-bold flex justify-center">Description</span>
                            <span className="flex justify-center">{activity.description}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-gray-500 font-bold flex justify-center">Interval (days)</span>
                            <span className="flex justify-center">{activity.daysToNext}</span>
                          </div>

                          { activity.type == "interval" &&
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-bold flex justify-center">Last Done</span>
                              <span className="flex justify-center">{activity.lastActivity}</span>
                            </div>

                          }

                          { activity.type == "interval" &&
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-bold flex justify-center">Next Due</span>
                              <span className="flex justify-center">{activity.nextActivity}</span>
                            </div>
                          }

                          { activity.type == "days" &&
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-bold flex justify-center">Days</span>
                              <span className="flex justify-center">{getSequenceDays(activity.daysStatus)}</span>
                            </div>
                          }

                          { activity.type == "days" &&
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-bold flex justify-center">Day of last relapse</span>
                              <span className="flex justify-center">{activity.lastRelapse} (Streak of {calcStreak(activity)})</span>
                            </div>
                          }

                          { activity.type == "days" &&
                            <div className="flex flex-col">
                              <span className="text-gray-500 font-bold flex justify-center">Last Activity</span>
                              <span className="flex justify-center">{activity.lastActivity}</span>
                            </div>
                          }
                          

                          <div className="mt-2 flex justify-center gap-3">
                            <Image src="/edit.png" alt="edit" width={15} height={15} className={`cursor-pointer ${editIndexes[0] == indexTopic && editIndexes[1] == index ? 'bg-yellow-400' : null}`}
                              onClick={() => {
                                  if (editIndexes[0] == indexTopic && editIndexes[1] == index) {
                                    setEditIndexes([-1, -1]);
                                    setActivity(initialActivity);
                                  }
                                  else {
                                    setEditIndexes([indexTopic, index]);
                                    setActivity(categories[indexTopic].data[index]);
                                    setTopic(category.name);
                                  }

                                }}
                            />

                            <Image src="/delete.png" alt="delete" width={15} height={15} className="cursor-pointer"
                              onClick={() => {
                                  deleteActivity(indexTopic, index);
                                }}
                            />

                            <Image src="/check-mark.png" alt="check" width={15} height={15} className="cursor-pointer"
                              onClick={() => {
                                  doneTodayActivity(index, indexTopic);
                                }}
                            />

                            { activity.type == 'days' &&
                              <Image src="/cancel.png" alt="check" width={15} height={15} className="cursor-pointer"
                                onClick={() => {
                                  notDoneTodayActivity(index, indexTopic);
                                  }}
                              />
                            }
                            
                            

                            <Image src="/up.png" alt="up" width={15} height={15} className="cursor-pointer"
                              onClick={() => {
                                  changePositionActivity(index - 1, index, indexTopic);
                                }}
                            />

                            <Image src="/down.png" alt="down" width={15} height={15} className="cursor-pointer"
                              onClick={() => {
                                  changePositionActivity(index, index + 1, indexTopic);
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
          })
        }
      </div>
      
    </div>
  )
}