import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onSubmit?: (title: string) => void;
  onAdd?: (title: string) => void;
  addTodo?: (title: string) => void;
  // title: string;
  // // setTitle: Dispatch<SetStateAction<string>>;
  isLoading?: boolean;
}

export const TodoForm: React.FC<Props> = ({
  onSubmit,
  onAdd,
  addTodo,
  // title,
  // setTitle,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const titileField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titileField.current) {
      titileField.current.focus();
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = title.trim();

    if (onSubmit) {
      await onSubmit(trimmed);
    } else if (onAdd) {
      await onAdd(trimmed);
    } else if (addTodo) {
      await addTodo(trimmed);
    }

    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        data-cy="NewTodoField"
        type="text"
        className="todoapp__new-todo"
        placeholder="What needs to be done?"
        ref={titileField}
        value={title}
        disabled={isLoading}
        onChange={e => setTitle(e.target.value)}
      />
    </form>
  );
};
