"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { BookCard } from "@/components/book-card";
import { AddBookDialog } from "@/components/add-book-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookGridSkeleton, EmptyState } from "@/components/loading";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, LogOut, Search, Library, Menu, X } from "lucide-react";

interface BookOwner {
  id: string;
  name: string | null;
  image: string | null;
}

interface RentalUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface CurrentRental {
  id: string;
  rentedAt: string;
  user: RentalUser;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
  owner: BookOwner;
  isAvailable: boolean;
  currentRental: CurrentRental | null;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter === "available") params.set("available", "true");
      if (filter === "rented") params.set("available", "false");

      const response = await fetch(`/api/books?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setIsInitialLoad(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Filter books by search term
  const filteredBooks = books.filter((book) => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower) ||
      book.isbn?.toLowerCase().includes(searchLower) ||
      book.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-small.svg"
                alt="Rankacy Logo"
                width={24}
                height={24}
                className="h-5 w-5 sm:h-6 sm:w-6"
              />
              <h1 className="text-lg sm:text-xl font-bold">Rankacy Library</h1>
            </Link>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-3">
              <ThemeToggle />
              {status === "loading" ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : session ? (
                <>
                  <AddBookDialog onBookAdded={fetchBooks} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user?.image || undefined} />
                          <AvatarFallback>
                            {session.user?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {session.user?.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {session.user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/my-books">
                          <Library className="mr-2 h-4 w-4" />
                          My Books
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button onClick={() => signIn("google")} size="sm">
                  Sign in
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t mt-3 pt-3 pb-2">
              {status === "loading" ? (
                <div className="flex items-center gap-3 py-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : session ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 py-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.user?.image || undefined} />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <AddBookDialog onBookAdded={fetchBooks} />
                    <Button
                      variant="outline"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/my-books">
                        <Library className="mr-2 h-4 w-4" />
                        My Books
                      </Link>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button onClick={() => signIn("google")} className="w-full">
                  Sign in with Google
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold">Books</h2>
            <span className="text-sm text-muted-foreground">
              {filteredBooks.length}{" "}
              {filteredBooks.length === 1 ? "book" : "books"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Books</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Books grid */}
        {isInitialLoad ? (
          <BookGridSkeleton count={6} />
        ) : filteredBooks.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-12 w-12 text-muted-foreground" />}
            title={books.length === 0 ? "No books yet" : "No books found"}
            description={
              books.length === 0
                ? session
                  ? "Be the first to add a book to the library!"
                  : "Sign in to add the first book to the library!"
                : "Try adjusting your search or filter."
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onUpdate={fetchBooks} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
