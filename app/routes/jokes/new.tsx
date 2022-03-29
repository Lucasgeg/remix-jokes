import type { ActionFunction } from "remix";
import { useActionData,json, redirect, Form } from "remix";

import { db } from "~/utils/db.server";
import {requireUserId} from "~/utils/session.server";

function validationJokeContent(content:string) {
  if(content.length <10){
    return "Joke is too short!"
  }
}
function validationJokename(name:string) {
  if(name.length <3){
    return "Name is too short!"
  }
}

type ActionData= {
  formError?: string;
  fieldErrors?: {
    name: string | undefined;
    content: string|undefined;
  };
  fields?:{
    name: string;
    content : string;
  }
}

const badRequest = (data: ActionData)=>
  json(data, {status:400})

export const action: ActionFunction =async ({request}) => {
  const userId= await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name");
  const content = form.get("content");
  // we do this type check to be extra sure and to make TypeScript happy
  // we'll explore validation next!
  if(
    typeof name !== "string" ||
    typeof content !== "string"
  ){
     return badRequest({
       formError:`Form not submitted correctly`
     })
  }

  const fieldErrors={
    name:validationJokename(name),
    content: validationJokeContent(content),
  }
  
  const fields =  {name, content, jokesterId: userId}

  if(Object.values(fieldErrors).some(Boolean)){
    return badRequest({fieldErrors, fields});}

  const joke = await db.joke.create({
    data:{...fields, jokesterId: userId}
  })
  return redirect(`/jokes/${joke.id}`)
}

export default function NewJokeRoute() {
  const actionData = useActionData<ActionData>();
      return (
      <div>
        <p>Add your own hilarious joke</p>
        <Form method="post">
          <div>
            <label>
              Name:{" "} 
              <input type="text"
              defaultValue={actionData?.fields?.name}
              name="name"
              aria-invalid={
                Boolean(actionData?.fieldErrors?.name)|| undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.name
                ?"name-error"
                :undefined
              }
              />
            </label>
            {actionData?.fieldErrors?.name ?(
              <p
                className="form-validation-error"
                role="alert"
                id="name-error">
                  {actionData.fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <label>
              Content:{" "} 
              <textarea
              defaultValue={actionData?.fieldErrors?.content}
              name="content"
              aria-invalid={
                Boolean(actionData?.fieldErrors?.content)||undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.content
                ? "content-error"
                :undefined
              }
              />
            </label>
            {actionData?.fieldErrors?.content? (
              <p
              className="form-validation-error"
              role="alert"
              id="content-error"
              >
                {actionData.fieldErrors.content}
              </p>
            ):null}
          </div>
          <div>
            {actionData?.formError? (
              <p
              className="form-validation-error"
              role="alert"
              >
                {actionData.formError}
              </p>
            ):null}
            <button type="submit" className="button">
              Add
            </button>
          </div>
        </Form>
      </div>
    );
  }
  export function ErrorBoundary() {
    return (
      <div className="error-container">
        Something unexpected went wrong. Sorry about that.
      </div>
    );
  }