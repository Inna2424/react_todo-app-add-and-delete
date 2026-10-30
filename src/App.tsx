/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { deleteTodos, getTodos, postTodos, USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import { TodoForm } from './components/TodoForm/TodoForm';
import classNames from 'classnames';

enum FilterStatus {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterStatus>(FilterStatus.All);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>();
  const [isLoading, setIsLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setErrorMessage(null);
    getTodos()
      .then(todo => {
        setTodos(todo);
      })
      .catch(() => {
        setErrorMessage('Unable to load todos');
      });
  }, []);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timerId = setTimeout(() => {
      setErrorMessage(null);
    }, 3000);

    return () => {
      clearTimeout(timerId);
    };
  }, [errorMessage]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const isAllCompleted =
    todos.length > 0 && todos.every(todo => todo.completed);

  const hasCompleted = todos.some(todo => todo.completed);

  const activeTodosCount = todos.filter(todo => !todo.completed).length;

  const visibleTodos = todos.filter(todo => {
    if (filter === FilterStatus.All) {
      return true;
    }

    if (filter === FilterStatus.Active) {
      return todo.completed === false;
    }

    if (filter === FilterStatus.Completed) {
      return todo.completed === true;
    }
  });

  const filters = [
    { value: FilterStatus.All, label: 'All', href: '#/', cy: 'FilterLinkAll' },
    {
      value: FilterStatus.Active,
      label: 'Active',
      href: '#/active',
      cy: 'FilterLinkActive',
    },
    {
      value: FilterStatus.Completed,
      label: 'Completed',
      href: '#/completed',
      cy: 'FilterLinkCompleted',
    },
  ];

  const handleAddTodo = () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setErrorMessage('Title should not be empty');

      return;
    }

    const temporaryTodo: Todo = {
      id: 0,
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    };

    setErrorMessage('');
    setIsLoading(true);
    setTempTodo(temporaryTodo);

    postTodos({
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    })
      .then(createdTodo => {
        setTodos(prev => [...prev, createdTodo]);
        setTitle('');
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
      })
      .finally(() => {
        setTempTodo(null);
        setIsLoading(false);
      });
  };

  function deleteTodo(todoId: number) {
    setErrorMessage('');
    setDeletingIds(prev => [...prev, todoId]);

    deleteTodos(todoId)
      .then(() => {
        setTodos(prev => prev.filter(todo => todo.id !== todoId));
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
      })
      .finally(() => {
        setDeletingIds(prev => prev.filter(id => id !== todoId));
        titleInputRef.current?.focus();
      });
  }

  async function deleteCompletedTodo() {
    const completedIds = todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    if (completedIds.length === 0) {
      return;
    }

    setErrorMessage('');
    setDeletingIds(prev => [...prev, ...completedIds]);

    const results = await Promise.allSettled(
      completedIds.map(id => deleteTodos(id)),
    );

    const deletedIds = completedIds.filter(
      (_, index) => results[index].status === 'fulfilled',
    );

    setTodos(current => current.filter(todo => !deletedIds.includes(todo.id)));

    if (deletedIds.length < completedIds.length) {
      setErrorMessage('Unable to delete a todo');
    }

    setDeletingIds(prev => prev.filter(id => !completedIds.includes(id)));
    titleInputRef.current?.focus();
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className={`todoapp__toggle-all ${isAllCompleted ? 'active' : ''}`}
            data-cy="ToggleAllButton"
          />

          <TodoForm
            title={title}
            setTitle={setTitle}
            onSubmit={handleAddTodo}
            isLoading={isLoading}
            inputRef={titleInputRef}
          />
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {visibleTodos.map(todo => (
            <div
              data-cy="Todo"
              key={todo.id}
              className={`todo ${todo.completed === true ? 'completed' : ''}`}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                />
              </label>

              {false ? (
                <form>
                  <input
                    data-cy="TodoTitleField"
                    type="text"
                    className="todo__title-field"
                    placeholder="Empty todo will be deleted"
                    value="Todo is being edited now"
                  />
                </form>
              ) : (
                <span data-cy="TodoTitle" className="todo__title">
                  {todo.title}
                </span>
              )}

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={() => {
                  deleteTodo(todo.id);
                }}
              >
                ×
              </button>

              <div
                data-cy="TodoLoader"
                className={classNames('modal overlay', {
                  'is-active': deletingIds.includes(todo.id),
                })}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}
          {tempTodo && (
            <div data-cy="Todo" className="todo">
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  disabled
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {tempTodo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
              >
                ×
              </button>

              <div data-cy="TodoLoader" className="modal overlay is-active">
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          )}
        </section>

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {`${activeTodosCount} ${activeTodosCount === 1 ? 'item' : 'items'} left`}
            </span>

            <nav className="filter" data-cy="Filter">
              {filters.map(({ value, label, href, cy }) => (
                <a
                  key={value}
                  href={href}
                  data-cy={cy}
                  className={`filtered__link ${filter === value ? 'selected' : ''}`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </a>
              ))}
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={!hasCompleted}
              onClick={deleteCompletedTodo}
            >
              Clear completed
            </button>
          </footer>
        )}

        <div
          data-cy="ErrorNotification"
          className={classNames(
            'notification is-danger is-light has-text-weight-normal',
            {
              hidden: !errorMessage,
            },
          )}
        >
          <button
            data-cy="HideErrorButton"
            type="button"
            className="delete"
            onClick={() => setErrorMessage('')}
          />
          {errorMessage}
        </div>
      </div>
    </div>
  );
};
