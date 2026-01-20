"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Mail,
  Lock,
  Bot,
  BarChart3,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const features = [
  { icon: BarChart3, text: "Seguimiento de proyectos en tiempo real" },
  { icon: Calendar, text: "Gantt interactivo con drag & drop" },
  { icon: Users, text: "Gestión de recursos y asignaciones" },
  { icon: CheckCircle2, text: "Control de eventos y blockers" },
];

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ general: "Email o contraseña incorrectos" });
        toast.error("Error de autenticación", {
          description: "Email o contraseña incorrectos",
        });
        triggerShake();
      } else {
        toast.success("¡Bienvenido!", {
          description: "Iniciando sesión...",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setErrors({ general: "Ocurrió un error al conectar con el servidor" });
      toast.error("Error de conexión", {
        description: "No se pudo conectar con el servidor",
      });
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Hero Section - Solo visible en lg+ */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>

        {/* Header con logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold">S</span>
            </div>
            <span className="text-xl font-semibold">Seidor RPA</span>
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 space-y-8">
          {/* Ilustración */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center">
              <Bot className="w-16 h-16 text-white/80" />
            </div>
          </div>

          {/* Tagline */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">
              Gestiona tus proyectos RPA con precisión
            </h1>
            <p className="text-blue-100/80 text-lg">
              La plataforma integral para equipos de automatización
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm text-blue-100/90"
              >
                <feature.icon className="w-5 h-5 text-blue-300 shrink-0" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-blue-200/60">
          © {new Date().getFullYear()} Seidor. Todos los derechos reservados.
        </div>
      </div>

      {/* Formulario Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Header del formulario */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">S</span>
              </div>
              <span className="text-2xl font-bold lg:hidden">Seidor RPA</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-muted-foreground mt-2">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{errors.general}</p>
            </div>
          )}

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className={cn("space-y-6", shake && "animate-shake")}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                      errors.email ? "text-destructive" : "text-muted-foreground"
                    )}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@seidor.com"
                    className={cn(
                      "pl-10",
                      errors.email &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      clearFieldError("email");
                    }}
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                      errors.password
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "pl-10 pr-10",
                      errors.password &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      clearFieldError("password");
                    }}
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          {/* Footer móvil */}
          <p className="text-center text-sm text-muted-foreground lg:hidden">
            © {new Date().getFullYear()} Seidor. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
