import { Component, OnInit } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { Todo, TodoService } from "./todo.service";

@Component({
  selector: "app-root",
  template: `
    <div class="page">
      <header class="header">
        <div>
          <h1>Serverless Todo</h1>
          <p class="subtitle">Lambda + DynamoDB + API Gateway</p>
        </div>
        <button class="refresh" (click)="loadTodos()" [disabled]="loading">Refresh</button>
      </header>

      <section class="card">
        <form (submit)="createTodo($event)" class="new-todo">
          <input
            type="text"
            name="text"
            placeholder="Add a task"
            [(ngModel)]="newText"
            [disabled]="loading"
            required
          />
          <button type="submit" [disabled]="loading || !newText.trim()">Add</button>
        </form>

        <div class="status" *ngIf="error">{{ error }}</div>
        <div class="status" *ngIf="loading">Loading...</div>

        <ul class="todo-list" *ngIf="!loading">
          <li *ngFor="let todo of todos" [class.completed]="todo.completed">
            <label>
              <input
                type="checkbox"
                [checked]="todo.completed"
                (change)="toggleTodo(todo)"
              />
              <span>{{ todo.text }}</span>
            </label>
            <button class="delete" (click)="removeTodo(todo)">Delete</button>
          </li>
        </ul>
      </section>
    </div>
  `
})
export class AppComponent implements OnInit {
  todos: Todo[] = [];
  newText = "";
  loading = false;
  error = "";

  constructor(private todosService: TodoService) {}

  ngOnInit(): void {
    void this.loadTodos();
  }

  async loadTodos(): Promise<void> {
    this.loading = true;
    this.error = "";
    try {
      this.todos = await firstValueFrom(this.todosService.list());
    } catch (err) {
      this.error = "Unable to load todos.";
    } finally {
      this.loading = false;
    }
  }

  async createTodo(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.newText.trim()) {
      return;
    }

    this.loading = true;
    this.error = "";
    try {
      const todo = await firstValueFrom(this.todosService.create(this.newText.trim()));
      this.todos = [...this.todos, todo];
      this.newText = "";
    } catch (err) {
      this.error = "Unable to add todo.";
    } finally {
      this.loading = false;
    }
  }

  async toggleTodo(todo: Todo): Promise<void> {
    this.loading = true;
    this.error = "";
    try {
      const updated = await firstValueFrom(
        this.todosService.update(todo.id, { completed: !todo.completed })
      );
      this.todos = this.todos.map((item) => (item.id === updated.id ? updated : item));
    } catch (err) {
      this.error = "Unable to update todo.";
    } finally {
      this.loading = false;
    }
  }

  async removeTodo(todo: Todo): Promise<void> {
    this.loading = true;
    this.error = "";
    try {
      await firstValueFrom(this.todosService.remove(todo.id));
      this.todos = this.todos.filter((item) => item.id !== todo.id);
    } catch (err) {
      this.error = "Unable to delete todo.";
    } finally {
      this.loading = false;
    }
  }
}
