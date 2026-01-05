import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../environments/environment";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: "root" })
export class TodoService {
  private readonly baseUrl = environment.apiBase;

  constructor(private http: HttpClient) {}

  list(): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.baseUrl}/todos`);
  }

  create(text: string): Observable<Todo> {
    return this.http.post<Todo>(`${this.baseUrl}/todos`, { text });
  }

  update(id: string, updates: Partial<Pick<Todo, "text" | "completed">>): Observable<Todo> {
    return this.http.patch<Todo>(`${this.baseUrl}/todos/${id}`, updates);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/todos/${id}`);
  }
}
