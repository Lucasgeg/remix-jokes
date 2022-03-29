import type { LoaderFunction, ActionFunction, MetaFunction } from "remix";
import { json, Link, useLoaderData, useParams, useCatch, redirect } from "remix";
import type { Joke } from "@prisma/client";

import { db } from "~/utils/db.server";
import{
  getUserId,
  requireUserId
} from "~/utils/session.server"
import { Response } from "node-fetch";

export const meta: MetaFunction =({
  data,
}:{
  data: LoaderData | undefined;
})=>{
  if(!data){
    return{
      title:"no Joke",
      description:"No joke found"
    }
  }
  return{
    title: `"${data.joke.name}" joke`,
    description: `Enjoy the "${data.joke.name}" joke and much more`,  
  }
}


type LoaderData = {joke:Joke; isOwner:Boolean}




export const loader: LoaderFunction = async ({
  request,
  params,
})=>{
  const userId = await getUserId(request);
  const joke= await db.joke.findUnique({
    where: { id:params.jokeId}
  });
  if (!joke){
    throw new Response("What a joke! There's no one!",{status:404})
  }

  const data: LoaderData= {
    joke,
    isOwner: userId === joke.jokesterId
  };
  return json(data)
}

export const action: ActionFunction = async ({
  request,
  params,
})=>{
  const form= await request.formData();
  if (form.get("_method") !== "delete"){
    throw new Response(
      `The _method ${form.get("_method")} is not supported`,
      {status:400}
    )
  }
  const userId= await requireUserId(request)
  const joke = await db.joke.findUnique({
    where: {id: params.jokeId},
  })
  if(!joke){
    throw new Response("Can't delete what does not exist",{status:404})
  }
  if (joke.jokesterId !== userId){
    throw new Response("Pshhh, nice try.That's not your joke", {status: 401})
  }
  await db.joke.delete({where: {id: params.jokeId}})
  return redirect("/jokes")
}

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();
  
    return (
      <div>
        <p>Here's your hilarious joke:</p>
        <p>
          {data.joke.content}</p>
          <Link to=".">{data.joke.name} Permalink</Link>
          {data.isOwner ? (
            <form method="post">
              <input type="hidden"
              name="_method"
              value="delete"/>
              <button type="submit" className="button">Delete</button>
            </form>
          ):null}
      </div>
    );
  }



  export function CatchBoundary(){
    const caught = useCatch();
    const params= useParams();
    switch (caught.status){
      case 400:{
        return(
          <div className="error-container">
            What you're trying to do is not allowed
          </div>
        )
      }
      case 404:{
        return(
          <div className="error-container">
            Huh? What the heck is {params.jokeId}?
          </div>
        )
      }
      case 401:{
        return(
          <div className="error-container">
            Sorry, but {params.jokeId} is not your joke.
          </div>
        )
      }
      default:{
        throw new Error(`Unhandled error: ${caught.status}`)
      }
    }
  }

  export function ErrorBoundary(){
    const {jokeId} = useParams();
    return(
      <div className="error-container">
        {`There was an error loading joke by the id ${jokeId}. Sorry.`}
      </div>
    )
  }