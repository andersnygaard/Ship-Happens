/**
 * Toast — Non-intrusive notification system for game messages.
 * Displays auto-dismissing messages at the top-center of the screen.
 * Supports info, success, warning, and error types with a queue system.
 */

export type ToastType = "info" | "success" | "warning" | "error";

interface ToastItem {
  message: string;
  type: ToastType;
  duration: number;
}

const DEFAULT_DURATION = 3000;
const MAX_VISIBLE = 3;

class ToastManager {
  private container: HTMLElement | null = null;
  private queue: ToastItem[] = [];
  private visibleCount = 0;

  /** Ensure the container exists in the DOM. */
  private ensureContainer(): HTMLElement {
    if (this.container && document.body.contains(this.container)) {
      return this.container;
    }
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    document.body.appendChild(this.container);
    return this.container;
  }

  /** Show a toast notification. */
  show(message: string, type: ToastType = "info", duration = DEFAULT_DURATION): void {
    const item: ToastItem = { message, type, duration };

    if (this.visibleCount >= MAX_VISIBLE) {
      this.queue.push(item);
      return;
    }

    this.displayToast(item);
  }

  private displayToast(item: ToastItem): void {
    const container = this.ensureContainer();
    this.visibleCount++;

    const toast = document.createElement("div");
    toast.className = `toast toast-${item.type}`;
    toast.textContent = item.message;

    // Click to dismiss early
    toast.addEventListener("click", () => this.dismissToast(toast));

    container.appendChild(toast);

    // Trigger entrance animation on next frame
    requestAnimationFrame(() => {
      toast.classList.add("toast-visible");
    });

    // Auto-dismiss
    setTimeout(() => this.dismissToast(toast), item.duration);
  }

  private dismissToast(toast: HTMLElement): void {
    if (toast.classList.contains("toast-dismissed")) return;
    toast.classList.add("toast-dismissed");
    toast.classList.remove("toast-visible");

    toast.addEventListener("transitionend", () => {
      toast.remove();
      this.visibleCount--;
      this.processQueue();
    }, { once: true });

    // Fallback removal if transitionend doesn't fire
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
        this.visibleCount--;
        this.processQueue();
      }
    }, 500);
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.visibleCount < MAX_VISIBLE) {
      const next = this.queue.shift()!;
      this.displayToast(next);
    }
  }
}

/** Singleton toast manager instance. */
export const toast = new ToastManager();
