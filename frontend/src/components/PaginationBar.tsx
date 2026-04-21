type Props = {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
};

export function PaginationBar({ page, totalPages, onChange }: Props) {
  return (
    <div className="row">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      <span>
        Page {page} / {Math.max(totalPages, 1)}
      </span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
