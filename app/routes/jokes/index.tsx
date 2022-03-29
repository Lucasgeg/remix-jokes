import type { LoaderFunction } from "remix"
import { json, useLoaderData, Link } from "remix"
import type { Joke } from "@prisma/client"

import { db } from "~/utils/db.server"

type LoaderData = {randomJoke: Joke}

export const loader: LoaderFunction = async() =>{
  const count= await db.joke.count();
  const randomNumber = Math.floor(Math.random()*count)
  const [randomJoke] = await db.joke.findMany({
    take:1,
    skip: randomNumber
  })
  const data: LoaderData = {randomJoke}
  return json(data)
}


export default function JokesIndexRoute(){
  const data = useLoaderData<LoaderData>();
    return(
        <div>
      <p>Here's a random joke:</p>
      <p>{data.randomJoke.content}</p>
       <Link to={data.randomJoke.id}>"{data.randomJoke.name}" Permalink</Link>
      
    </div>
    )
}
export function ErrorBoundary() {
  return (
    <div className="error-container">
      I did a whoopsies.
    </div>
  );
}