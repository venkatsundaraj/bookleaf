import type { Book } from "@/lib/types";
import { bookStatusLabel, formatDate, formatRupees } from "@/lib/format";

const COLUMNS = [
  "Title",
  "ISBN",
  "Genre",
  "Published",
  "Status",
  "MRP",
  "Copies sold",
  "Royalty earned",
  "Royalty paid",
  "Royalty pending",
];

export function BooksTable({ books }: { books: Book[] }) {
  return (
    <table>
      <thead>
        <tr>
          {COLUMNS.map((column) => (
            <th key={column} className="p-2">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {books.map((book) => (
          <tr key={book.id}>
            <td className="p-2">{book.title}</td>
            <td className="p-2">{book.serialOfISBN}</td>
            <td className="p-2">{book.genre}</td>
            <td className="p-2">
              {book.publication ? formatDate(book.publication) : "Not yet"}
            </td>
            <td className="p-2">{bookStatusLabel(book.status)}</td>
            <td className="p-2">{formatRupees(book.valueOfMRP)}</td>
            <td className="p-2">{book.copiesSold}</td>
            <td className="p-2">{formatRupees(book.royaltyEarned)}</td>
            <td className="p-2">{formatRupees(book.royaltyPaid)}</td>
            <td className="p-2">{formatRupees(book.royaltyPending)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
