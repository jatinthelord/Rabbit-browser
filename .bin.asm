; Binarys + opcode

section .data
    ; HTML Template for browser display
    html_header: db '<!DOCTYPE html><html><head><title>ASM Image</title></head><body>', 0
    html_header_len: equ $ - html_header
    
    html_img_start: db '<img src="data:image/bmp;base64,', 0
    html_img_start_len: equ $ - html_img_start
    
    html_img_end: db '" alt="Assembly Generated"/></body></html>', 0
    html_img_end_len: equ $ - html_img_end
    
    ; BMP Header (54 bytes for 16x16 24-bit bitmap)
    bmp_header:
        db 'BM'                     ; Signature
        dd 54 + 768                 ; File size (header + 16x16x3)
        dd 0                        ; Reserved
        dd 54                       ; Offset to pixel data
        dd 40                       ; DIB header size
        dd 16                       ; Width
        dd 16                       ; Height
        dw 1                        ; Color planes
        dw 24                       ; Bits per pixel
        dd 0                        ; Compression (none)
        dd 768                      ; Image size
        dd 2835                     ; X pixels per meter
        dd 2835                     ; Y pixels per meter
        dd 0                        ; Colors in palette
        dd 0                        ; Important colors
    
    ; File paths
    html_file: db 'output.html', 0
    bin_file: db 'opcodes.bin', 0
    image_file: db 'image.bmp', 0
    
    ; Messages
    msg_html_created: db 'HTML file created successfully', 10, 0
    msg_bin_created: db 'Binary file created with opcodes', 10, 0
    msg_bin_read: db 'Binary file read and analyzed', 10, 0
    msg_opcode_info: db 'OPCode Analysis:', 10, 0
    
    ; Hardware OPCodes (x86-64 instructions in binary)
    opcodes_sample:
        db 0x90                     ; NOP
        db 0x48, 0x89, 0xC3         ; MOV RBX, RAX
        db 0x48, 0x01, 0xD8         ; ADD RAX, RBX
        db 0x48, 0x31, 0xC0         ; XOR RAX, RAX
        db 0xC3                     ; RET
        db 0x0F, 0x05               ; SYSCALL
    opcodes_len: equ $ - opcodes_sample
    
    newline: db 10
    hex_chars: db '0123456789ABCDEF'

section .bss
    file_descriptor: resq 1
    buffer: resb 4096
    pixel_data: resb 768            ; 16x16x3 bytes for RGB
    base64_buffer: resb 2048
    opcode_buffer: resb 256

section .text
    global _start

_start:
    ; Generate pixel data (simple gradient pattern)
    call generate_pixel_data
    
    ; Create BMP image file
    call create_bmp_file
    
    ; Create HTML file with embedded image
    call create_html_file
    
    ; Create and manage binary opcode file
    call create_opcode_binary
    
    ; Read and analyze opcode binary
    call analyze_opcode_binary
    
    ; Execute some opcodes directly
    call execute_dynamic_opcodes
    
    ; Exit program
    mov rax, 60                     ; sys_exit
    xor rdi, rdi                    ; exit code 0
    syscall

; ============================================================================
; Generate simple pixel data (16x16 RGB gradient)
; ============================================================================
generate_pixel_data:
    push rbp
    mov rbp, rsp
    
    xor rcx, rcx                    ; Row counter
    
.row_loop:
    xor rdx, rdx                    ; Column counter
    
.col_loop:
    ; Calculate pixel index: (row * 16 + col) * 3
    mov rax, rcx
    imul rax, 16
    add rax, rdx
    imul rax, 3
    
    ; Generate RGB values based on position
    mov byte [pixel_data + rax], cl      ; Blue
    mov byte [pixel_data + rax + 1], dl  ; Green  
    mov byte [pixel_data + rax + 2], 255 ; Red
    
    inc rdx
    cmp rdx, 16
    jl .col_loop
    
    inc rcx
    cmp rcx, 16
    jl .row_loop
    
    pop rbp
    ret

; ============================================================================
; Create BMP image file
; ============================================================================
create_bmp_file:
    push rbp
    mov rbp, rsp
    
    ; Open file for writing
    mov rax, 2                      ; sys_open
    lea rdi, [image_file]
    mov rsi, 0x241                  ; O_CREAT | O_WRONLY | O_TRUNC
    mov rdx, 0644o
    syscall
    mov [file_descriptor], rax
    
    ; Write BMP header
    mov rax, 1                      ; sys_write
    mov rdi, [file_descriptor]
    lea rsi, [bmp_header]
    mov rdx, 54
    syscall
    
    ; Write pixel data
    mov rax, 1                      ; sys_write
    mov rdi, [file_descriptor]
    lea rsi, [pixel_data]
    mov rdx, 768
    syscall
    
    ; Close file
    mov rax, 3                      ; sys_close
    mov rdi, [file_descriptor]
    syscall
    
    pop rbp
    ret

; ============================================================================
; Create HTML file with embedded image
; ============================================================================
create_html_file:
    push rbp
    mov rbp, rsp
    
    ; Open HTML file
    mov rax, 2                      ; sys_open
    lea rdi, [html_file]
    mov rsi, 0x241                  ; O_CREAT | O_WRONLY | O_TRUNC
    mov rdx, 0644o
    syscall
    mov [file_descriptor], rax
    
    ; Write HTML header
    mov rax, 1
    mov rdi, [file_descriptor]
    lea rsi, [html_header]
    mov rdx, html_header_len
    syscall
    
    ; Write image tag start
    mov rax, 1
    mov rdi, [file_descriptor]
    lea rsi, [html_img_start]
    mov rdx, html_img_start_len
    syscall
    
    ; Note: Base64 encoding would go here (simplified for demonstration)
    ; Writing placeholder for base64 data
    mov rax, 1
    mov rdi, [file_descriptor]
    lea rsi, [msg_html_created]     ; Placeholder
    mov rdx, 15
    syscall
    
    ; Write image tag end
    mov rax, 1
    mov rdi, [file_descriptor]
    lea rsi, [html_img_end]
    mov rdx, html_img_end_len
    syscall
    
    ; Close file
    mov rax, 3
    mov rdi, [file_descriptor]
    syscall
    
    ; Print success message
    call print_msg_html
    
    pop rbp
    ret

; ============================================================================
; Create binary file with hardware opcodes
; ============================================================================
create_opcode_binary:
    push rbp
    mov rbp, rsp
    
    ; Open binary file
    mov rax, 2                      ; sys_open
    lea rdi, [bin_file]
    mov rsi, 0x241                  ; O_CREAT | O_WRONLY | O_TRUNC
    mov rdx, 0644o
    syscall
    mov [file_descriptor], rax
    
    ; Write opcode header (magic number + size)
    mov qword [buffer], 0x4D53414F454C4946  ; "FILEOASM" magic
    mov qword [buffer + 8], opcodes_len
    
    mov rax, 1                      ; sys_write
    mov rdi, [file_descriptor]
    lea rsi, [buffer]
    mov rdx, 16
    syscall
    
    ; Write actual opcodes
    mov rax, 1
    mov rdi, [file_descriptor]
    lea rsi, [opcodes_sample]
    mov rdx, opcodes_len
    syscall
    
    ; Close file
    mov rax, 3
    mov rdi, [file_descriptor]
    syscall
    
    ; Print success message
    call print_msg_bin_created
    
    pop rbp
    ret

; ============================================================================
; Analyze opcode binary file
; ============================================================================
analyze_opcode_binary:
    push rbp
    mov rbp, rsp
    
    ; Open binary file for reading
    mov rax, 2                      ; sys_open
    lea rdi, [bin_file]
    mov rsi, 0                      ; O_RDONLY
    syscall
    mov [file_descriptor], rax
    
    ; Read header
    mov rax, 0                      ; sys_read
    mov rdi, [file_descriptor]
    lea rsi, [opcode_buffer]
    mov rdx, 16
    syscall
    
    ; Read opcodes
    mov rax, 0
    mov rdi, [file_descriptor]
    lea rsi, [opcode_buffer + 16]
    mov rdx, 240
    syscall
    
    ; Close file
    mov rax, 3
    mov rdi, [file_descriptor]
    syscall
    
    ; Print analysis header
    call print_opcode_analysis
    
    ; Analyze each opcode
    xor rcx, rcx                    ; Counter
    
.analyze_loop:
    cmp rcx, opcodes_len
    jge .done
    
    ; Get opcode byte
    movzx rax, byte [opcode_buffer + 16 + rcx]
    
    ; Print opcode in hex
    call print_hex_byte
    
    ; Print newline
    mov rax, 1
    mov rdi, 1
    lea rsi, [newline]
    mov rdx, 1
    syscall
    
    inc rcx
    jmp .analyze_loop
    
.done:
    call print_msg_bin_read
    pop rbp
    ret

; ============================================================================
; Execute dynamically loaded opcodes (DANGEROUS - for demonstration only)
; ============================================================================
execute_dynamic_opcodes:
    push rbp
    mov rbp, rsp
    
    ; Allocate executable memory using mmap
    mov rax, 9                      ; sys_mmap
    xor rdi, rdi                    ; NULL (let kernel choose address)
    mov rsi, 4096                   ; Length
    mov rdx, 7                      ; PROT_READ | PROT_WRITE | PROT_EXEC
    mov r10, 0x22                   ; MAP_PRIVATE | MAP_ANONYMOUS
    mov r8, -1                      ; fd
    xor r9, r9                      ; offset
    syscall
    
    mov r12, rax                    ; Save memory address
    
    ; Copy opcodes to executable memory
    lea rsi, [opcodes_sample]
    mov rdi, r12
    mov rcx, opcodes_len
    rep movsb
    
    ; Call the opcodes (NOP, MOV, ADD, XOR, RET sequence)
    mov rax, 42                     ; Test value
    call r12                        ; Execute dynamic code
    
    ; Free executable memory
    mov rax, 11                     ; sys_munmap
    mov rdi, r12
    mov rsi, 4096
    syscall
    
    pop rbp
    ret

; ============================================================================
; Helper: Print hex byte in RAX
; ============================================================================
print_hex_byte:
    push rbp
    mov rbp, rsp
    push rax
    
    ; High nibble
    mov rbx, rax
    shr rbx, 4
    and rbx, 0x0F
    movzx rbx, byte [hex_chars + rbx]
    mov [buffer], bl
    
    ; Low nibble
    and rax, 0x0F
    movzx rax, byte [hex_chars + rax]
    mov [buffer + 1], al
    
    ; Space
    mov byte [buffer + 2], ' '
    
    ; Print
    mov rax, 1
    mov rdi, 1
    lea rsi, [buffer]
    mov rdx, 3
    syscall
    
    pop rax
    pop rbp
    ret

; ============================================================================
; Helper: Print messages
; ============================================================================
print_msg_html:
    mov rax, 1
    mov rdi, 1
    lea rsi, [msg_html_created]
    mov rdx, 30
    syscall
    ret

print_msg_bin_created:
    mov rax, 1
    mov rdi, 1
    lea rsi, [msg_bin_created]
    mov rdx, 35
    syscall
    ret

print_msg_bin_read:
    mov rax, 1
    mov rdi, 1
    lea rsi, [msg_bin_read]
    mov rdx, 30
    syscall
    ret

print_opcode_analysis:
    mov rax, 1
    mov rdi, 1
    lea rsi, [msg_opcode_info]
    mov rdx, 17
    syscall
    ret
